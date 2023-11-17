// Built with comlink-loader
// https://github.com/GoogleChromeLabs/comlink-loader

export const helloWorld = async (params: any) => {
  // heavy computing goes here
  console.log(params);
  return `${params}foo`;
};

export const extractJSON = async (html: string) => html.slice(0, 100);
