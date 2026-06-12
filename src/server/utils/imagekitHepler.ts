export function getImageKitUrl(
  path: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  }
): string {
  const baseUrl = "https://ik.imagekit.io/your_imagekit_id";
  let url = `${baseUrl}/${path}`;

  const params = [];

  if (options?.width) params.push(`w-${options.width}`);
  if (options?.height) params.push(`h-${options.height}`);
  if (options?.quality) params.push(`q-${options.quality}`);
  if (options?.format) params.push(`f-${options.format}`);

  if (params.length) {
    url += `?tr=${params.join(",")}`;
  }

  return url;
}
