import { User } from '@prisma/client';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { prisma } from 'db';
import { getSpacesOfUser } from '../getSpacesOfUser';

let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;

  // External space the user didn't create but is a contributor of
  const { space } = await generateUserAndSpaceWithApiToken();
  // Inaccessible space by the user
  await generateUserAndSpaceWithApiToken();

  await prisma.spaceRole.create({
    data: {
      userId: user.id,
      spaceId: space.id
    }
  });
});

describe('getSpacesCount', () => {
  it('Should get count of spaces the user is part of', async () => {
    const spaces = await getSpacesOfUser(user.id);
    expect(spaces.length).toBe(2);
  });
});
