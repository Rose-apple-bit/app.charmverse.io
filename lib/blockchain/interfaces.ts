
export interface NftData {
  id: string;
  tokenId: string;
  tokenIdInt: number | null;
  contract: string;
  title: string;
  description: string;
  chainId: number;
  image: string;
  imageRaw: string;
  imageThumb?: string;
  timeLastUpdated: string;
  isHidden: boolean;
}

export interface ExtendedPoap {
  id: string;
  imageURL: string;
  isHidden: boolean;
  walletAddress: string
  tokenId: string
  created: string
  name: string
}
