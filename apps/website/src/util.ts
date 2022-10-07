export const downloadFile = (name: string, data: ArrayBuffer | string) => {
  const a = document.createElement("a");
  const blob = new Blob([data]);
  const url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = name;
  a.click();
  window.URL.revokeObjectURL(url);
};
