export const getAllContentsFromStdinAtOnce = async () => {
  const reader = Bun.stdin.stream().getReader();
  let contents = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    // value is Uint8Array
    // Convert it to text
    const chunkText = new TextDecoder().decode(value);
    contents += chunkText;
  }
  reader.releaseLock();
  return contents;
};
