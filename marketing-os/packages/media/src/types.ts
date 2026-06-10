export interface GenerationProvider {
  name: 'stub' | 'dalle3' | 'stable-diffusion' | 'midjourney';
  apiKey?: string;
}
