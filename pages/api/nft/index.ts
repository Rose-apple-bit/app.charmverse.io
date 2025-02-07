import { NftData } from 'lib/blockchain/interfaces';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { onError, onNoMatch } from 'lib/middleware';
import { getNFT } from 'lib/blockchain/nfts';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .get(getNFTs);

async function getNFTs (req: NextApiRequest, res: NextApiResponse<NftData>) {
  const { tokenId, contractAddress } = req.query;
  const chainId = 1;

  if (typeof tokenId !== 'string' || typeof contractAddress !== 'string') {
    throw new InvalidInputError('Invalid NFT params');
  }

  const nft = await getNFT(contractAddress, tokenId, chainId);

  res.status(200).json(nft);
}

export default withSessionRoute(handler);
