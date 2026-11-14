# ErrorBoundary

렌더 오류에 기본 안내와 재시도 버튼을 표시한다. `message`, `retryLabel`,
`reloadLabel`로 문구를 바꾸거나 `fallbackRender`에서 전체 폴백을 구성한다.
`onError`에는 청크 오류를 포함한 렌더 오류가 전달된다.

청크 오류 자동 복구를 사용하려면 `chunkReloadPort`에 영속 저장·보고·reload를
주입한다. 기록을 다시 읽어 확인한 뒤에만 reload하며, 기본 TTL 30초 동안 중복
reload를 막는다. 포트가 없거나 저장이 차단되면 자동 reload하지 않고 수동
새로고침을 제공한다. `listenForChunkPreloadError`는 Vite의 preload 오류에 같은
포트를 적용하고 해제 함수를 반환한다. 컴포넌트 렌더 바깥의 이벤트 핸들러와
비동기 오류는 소비자가 직접 처리한다.
