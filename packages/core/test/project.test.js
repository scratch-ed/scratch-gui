import { Project } from '../src/project';

function project(...names) {
  return new Project({
    targets: names.map((n) => {
      return {
        name: n,
        variables: {},
        costumes: [],
        lists: [],
      };
    }),
    extensions: [],
  });
}

test('hasRemovedSprites', () => {
  expect(project('Test1', 'Test2').hasRemovedSprites(project('Test1'))).toBe(true);
  expect(project('Test1').hasRemovedSprites(project('Test1'))).toBe(false);
  expect(project('Test1').hasRemovedSprites(project('Test1', 'Test2'))).toBe(false);
  expect(project().hasRemovedSprites(project())).toBe(false);
  expect(project('Test1').hasRemovedSprites(project())).toBe(true);
  expect(project().hasRemovedSprites(project())).toBe(false);
});

test('hasAddedSprites', () => {
  expect(project('Test1', 'Test2').hasAddedSprites(project('Test1'))).toBe(false);
  expect(project('Test1').hasAddedSprites(project('Test1'))).toBe(false);
  expect(project('Test1').hasAddedSprites(project('Test1', 'Test2'))).toBe(true);
  expect(project().hasAddedSprites(project())).toBe(false);
  expect(project('Test1').hasAddedSprites(project())).toBe(false);
  expect(project().hasAddedSprites(project())).toBe(false);
});

test('hasChangedCostumes', () => {
  const one = new Project({
    targets: [
      { name: 'Test1', costumes: [{ assetId: 2 }, { assetId: 3 }] },
      { name: 'Test2', costumes: [{ assetId: 2 }, { assetId: 3 }] },
    ],
  });

  const two = new Project({
    targets: [
      { name: 'Test1', costumes: [{ assetId: 2 }, { assetId: 3 }] },
      { name: 'Test2', costumes: [{ assetId: 4 }] },
    ],
  });

  const three = new Project({ targets: [] });

  expect(one.hasChangedCostumes(two, 'Test1')).toBe(false);
  expect(one.hasChangedCostumes(two, 'Test2')).toBe(true);
  expect(one.hasChangedCostumes(three, 'Test1')).toBe(true);
  expect(three.hasChangedCostumes(three, 'Test1')).toBe(false);
});

test('containsSprite', () => {
  const one = new Project({
    targets: [{ name: 'Test1' }, { name: 'Test2' }],
  });

  const two = new Project({ targets: [] });

  expect(one.containsSprite('Test1')).toBe(true);
  expect(one.containsSprite('Test2')).toBe(true);
  expect(one.containsSprite('Test3')).toBe(false);
  expect(two.containsSprite('Test1')).toBe(false);
});
