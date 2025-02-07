import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import { BountyWithDetails } from 'models';

export default function NewBountyButton () {
  const { user } = useUser();
  const [currentSpace] = useCurrentSpace();
  const [currentUserPermissions] = useCurrentSpacePermissions();
  const suggestBounties = currentUserPermissions?.createBounty === false;
  const { setBounties } = useBounties();
  const { setPages } = usePages();
  const { showPage } = usePageDialog();

  async function onClickCreate () {
    if (currentSpace && user) {
      let createdBounty: BountyWithDetails;

      if (suggestBounties) {
        createdBounty = await charmClient.bounties.createBounty({
          chainId: 1,
          status: 'suggestion',
          spaceId: currentSpace.id,
          createdBy: user.id,
          rewardAmount: 0,
          rewardToken: 'ETH',
          permissions: {
            submitter: [{
              group: 'space',
              id: currentSpace.id
            }]
          }
        });
      }
      else {
        createdBounty = await charmClient.bounties.createBounty({
          chainId: 1,
          status: 'open',
          spaceId: currentSpace.id,
          createdBy: user.id,
          rewardAmount: 1,
          rewardToken: 'ETH',
          permissions: {
            submitter: [{
              group: 'space',
              id: currentSpace.id
            }]
          }
        });
      }
      setPages((pages) => ({ ...pages, [createdBounty.page.id]: createdBounty.page }));
      setBounties((bounties) => [...bounties, createdBounty]);
      showPage({
        pageId: createdBounty.page.id,
        hideToolsMenu: suggestBounties
      });
    }
  }

  return (
    <Button onClick={onClickCreate}>
      {suggestBounties ? 'Suggest Bounty' : 'Create Bounty'}
    </Button>
  );
}
