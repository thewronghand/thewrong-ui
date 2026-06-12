/**
 * 테이블 컬럼 프리셋 저장 관리 유틸리티
 *
 * 모든 테이블의 컬럼 순서/숨김 프리셋을 하나의 localStorage 키로 통합 관리해요.
 * 페이지마다 3개의 프리셋(1, 2, 3)을 저장할 수 있어요.
 */

export type PresetNumber = 1 | 2 | 3;

export interface ColumnPresetData {
  columnOrder: string[];
  hiddenColumns: string[];
  /**
   * 컬럼 키 → 픽셀 너비 매핑.
   * 사용자가 헤더를 드래그해 조정한 너비가 프리셋별로 저장된다.
   * 누락된 키는 컬럼 정의의 width / 자동 계산값을 따른다.
   */
  columnWidths?: Record<string, number>;
}

export interface PagePresets {
  activePreset: PresetNumber;
  presets: {
    [key in PresetNumber]: ColumnPresetData | string[] | null;
  };
}

export interface AllPresets {
  [pageKey: string]: PagePresets;
}

export class ColumnPresetStorage {
  private static readonly STORAGE_KEY = "thewrong.table_column_presets";

  private static isStorageAvailable(): boolean {
    try {
      const test = "__thewrong_storage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  static getAllPresets(): AllPresets {
    if (!this.isStorageAvailable()) {
      return {};
    }

    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        return {};
      }

      const parsed = JSON.parse(data);
      return typeof parsed === "object" && parsed !== null ? parsed : {};
    } catch (error) {
      console.error("Failed to load presets:", error);
      return {};
    }
  }

  private static saveAllPresets(presets: AllPresets): void {
    if (!this.isStorageAvailable()) {
      console.warn("localStorage is not available");
      return;
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(presets));
    } catch (error) {
      if ((error as Error).name === "QuotaExceededError") {
        console.error("localStorage quota exceeded");
      } else {
        console.error("Failed to save presets:", error);
      }
    }
  }

  static getPagePresets(pageKey: string): PagePresets | null {
    const allPresets = this.getAllPresets();
    return allPresets[pageKey] || null;
  }

  private static initializePagePresets(pageKey: string): PagePresets {
    const defaultPresets: PagePresets = {
      activePreset: 1,
      presets: {
        1: null,
        2: null,
        3: null,
      },
    };

    const allPresets = this.getAllPresets();
    if (!allPresets[pageKey]) {
      allPresets[pageKey] = defaultPresets;
      this.saveAllPresets(allPresets);
    }

    return allPresets[pageKey];
  }

  static getActivePreset(pageKey: string): PresetNumber {
    const pagePresets = this.getPagePresets(pageKey);
    return pagePresets?.activePreset || 1;
  }

  /**
   * 특정 프리셋의 컬럼 데이터 로드
   * 하위 호환: 기존 string[] 형태는 자동으로 ColumnPresetData로 변환
   */
  static getPresetColumns(
    pageKey: string,
    presetNum: PresetNumber,
  ): ColumnPresetData | null {
    const pagePresets = this.getPagePresets(pageKey);
    if (!pagePresets) {
      return null;
    }

    const preset = pagePresets.presets[presetNum];

    if (Array.isArray(preset)) {
      return {
        columnOrder: preset,
        hiddenColumns: [],
      };
    }

    if (!preset) return null;
    return {
      columnOrder: preset.columnOrder,
      hiddenColumns: preset.hiddenColumns ?? [],
      columnWidths: preset.columnWidths,
    };
  }

  static getActivePresetColumns(pageKey: string): ColumnPresetData | null {
    const activePreset = this.getActivePreset(pageKey);
    return this.getPresetColumns(pageKey, activePreset);
  }

  /**
   * 프리셋에 컬럼 데이터 저장
   * 하위 호환: string[] 형태도 지원 (자동으로 ColumnPresetData로 변환)
   */
  static savePreset(
    pageKey: string,
    presetNum: PresetNumber,
    data: ColumnPresetData | string[],
  ): void {
    const presetData: ColumnPresetData = Array.isArray(data)
      ? { columnOrder: data, hiddenColumns: [] }
      : data;

    if (
      !Array.isArray(presetData.columnOrder) ||
      presetData.columnOrder.length === 0
    ) {
      console.warn("Invalid column order:", presetData);
      return;
    }

    const allPresets = this.getAllPresets();

    if (!allPresets[pageKey]) {
      this.initializePagePresets(pageKey);
    }

    if (!allPresets[pageKey]) {
      allPresets[pageKey] = {
        activePreset: 1,
        presets: { 1: null, 2: null, 3: null },
      };
    }

    allPresets[pageKey].presets[presetNum] = {
      columnOrder: [...presetData.columnOrder],
      hiddenColumns: [...(presetData.hiddenColumns || [])],
      ...(presetData.columnWidths
        ? { columnWidths: { ...presetData.columnWidths } }
        : {}),
    };
    this.saveAllPresets(allPresets);
  }

  static setActivePreset(pageKey: string, presetNum: PresetNumber): void {
    const allPresets = this.getAllPresets();

    if (!allPresets[pageKey]) {
      this.initializePagePresets(pageKey);
    }

    if (allPresets[pageKey]) {
      allPresets[pageKey].activePreset = presetNum;
      this.saveAllPresets(allPresets);
    }
  }

  static clearPreset(pageKey: string, presetNum: PresetNumber): void {
    const allPresets = this.getAllPresets();

    if (allPresets[pageKey]) {
      allPresets[pageKey].presets[presetNum] = null;
      this.saveAllPresets(allPresets);
    }
  }

  static clearPagePresets(pageKey: string): void {
    const allPresets = this.getAllPresets();

    if (allPresets[pageKey]) {
      delete allPresets[pageKey];
      this.saveAllPresets(allPresets);
    }
  }

  /**
   * 기존 단일 키(string[]) localStorage 데이터를 프리셋 시스템으로 마이그레이션
   */
  static migrateFromLegacyStorage(pageKey: string, legacyKey: string): boolean {
    if (!this.isStorageAvailable()) {
      return false;
    }

    try {
      const existingPresets = this.getPagePresets(pageKey);
      if (existingPresets) {
        return false;
      }

      const legacyData = localStorage.getItem(legacyKey);
      if (!legacyData) {
        return false;
      }

      const parsed = JSON.parse(legacyData);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        return false;
      }

      this.savePreset(pageKey, 1, parsed);
      this.setActivePreset(pageKey, 1);

      localStorage.removeItem(legacyKey);

      return true;
    } catch (error) {
      console.error("Migration failed:", error);
      return false;
    }
  }

  static hasPreset(pageKey: string, presetNum: PresetNumber): boolean {
    const presetData = this.getPresetColumns(pageKey, presetNum);
    return presetData !== null && presetData.columnOrder.length > 0;
  }
}
