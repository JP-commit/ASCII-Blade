/// <reference types="vite/client" />

declare module '*.ascii?raw' {
  const content: string;
  export default content;
}

declare module '*.ascii' {
  const content: string;
  export default content;
}
