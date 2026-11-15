import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DecimalInput, Input } from "@/components/input";
import { Slider } from "./Slider";
import { normalizeSliderValue } from "./utils";

const meta = { title: "Components/Slider", component: Slider, args: { "aria-label": "크기", defaultValue: 45 } } satisfies Meta<typeof Slider>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const NormalizedChange: Story = {
  render: () => {
    const [changed, setChanged] = useState<number | null>(null);
    return (
      <div className="grid w-72 gap-3">
        <Slider aria-label="정규화 확인" min={0} max={1} step={0.1} defaultValue={0.2} onValueChange={setChanged} />
        <output aria-label="변경 값">{changed === null ? "변경 전" : String(changed)}</output>
      </div>
    );
  },
};
export const OpacityWithInput: Story = {
  render: () => {
    const [opacity, setOpacity] = useState(70);
    return (
      <div className="grid w-72 gap-3">
        <label htmlFor="opacity-slider">불투명도 {opacity}%</label>
        <Slider id="opacity-slider" min={10} max={100} value={opacity} onValueChange={setOpacity} formatValue={(value) => `${value}%`} />
        <Input variant="box" type="number" min={10} max={100} value={opacity} aria-label="불투명도 숫자 입력" onChange={(event) => setOpacity(normalizeSliderValue(Number(event.target.value), 10, 100, 1))} />
      </div>
    );
  },
};
export const VolumeWithDecimalInput: Story = {
  render: () => {
    const [volume, setVolume] = useState(-12);
    return (
      <div className="grid w-72 gap-3">
        <label htmlFor="volume-slider">음량 {volume} dB</label>
        <Slider id="volume-slider" min={-30} max={6} step={0.5} value={volume} onValueChange={setVolume} formatValue={(value) => `${value} 데시벨`} />
        <DecimalInput variant="box" value={volume} min={-30} max={6} decimalPlaces={1} allowNegative aria-label="음량 숫자 입력" onChange={(value) => setVolume(normalizeSliderValue(Number(value), -30, 6, 0.5))} />
      </div>
    );
  },
};
