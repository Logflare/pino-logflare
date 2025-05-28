declare module "entities/decode" {
  export interface EntityDecoder {
    // Add minimal type definition based on what parse5 expects
    [key: string]: any
  }

  // Export any other types that might be needed
  export const EntityDecoder: any
  export default EntityDecoder
}
