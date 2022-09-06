import { Modifier } from '../../types';
import EmbeddedCollection from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/embedded-collection.mjs';
import { ConfiguredDocumentClass } from '@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes';
import * as documents from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/documents.mjs';
import { SceneData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/sceneData';

export function applyModifiers(modifiers: Modifier[]): void {
  for (const modifier of modifiers) {
    GURPS.ModifierBucket.addModifier(modifier.mod, modifier.desc);
  }
}

export async function changeTokensSizeIfInTheSameGridPosition(token: TokenDocument, changes: any) {
  if (changes.x === undefined && changes.y === undefined) return;
  if (!game.user?.isGM) return;

  const newGridPosition: PointArray | { x: number; y: number } = game?.canvas?.grid?.grid?.getGridPositionFromPixels(
    changes.x || token.data.x,
    changes.y || token.data.y,
  ) || [0, 0];
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const originalPosition: PointArray = token.data.originalPosition;
  if (originalPosition[0] === newGridPosition[0] && originalPosition[1] === newGridPosition[1]) return;
  const tokens: EmbeddedCollection<ConfiguredDocumentClass<typeof documents.BaseToken>, SceneData> | any[] =
    game?.scenes?.active?.data?.tokens || [];
  const tokensInSamePos = tokens.filter((t: any) => {
    const gridPosition: PointArray | { x: number; y: number } = game?.canvas?.grid?.grid?.getGridPositionFromPixels(
      t.data.x,
      t.data.y,
    ) || [0, 0];
    return gridPosition[0] === newGridPosition[0] && gridPosition[1] === newGridPosition[1];
  });

  const tokensInTheOldPos = tokens.filter((t: any) => {
    const gridPosition: PointArray | { x: number; y: number } = game?.canvas?.grid?.grid?.getGridPositionFromPixels(
      t.data.x,
      t.data.y,
    ) || [0, 0];
    return gridPosition[0] === originalPosition[0] && gridPosition[1] === originalPosition[1];
  });

  if (tokensInSamePos.length > 1) {
    console.log(tokensInSamePos);
    for (let i = 0; i < tokensInSamePos.length; i++) {
      const token: TokenDocument = tokensInSamePos[i];
      if (token.data.width === 1) {
        const size: number = (game?.canvas?.grid?.grid?.w || 0) / 4;
        token.data.width = 0.5;
        token.data.height = 0.5;

        let newX = 0;
        let newY = 0;
        switch (i) {
          case 0:
            newX = token.data.x;
            newY = token.data.y + size;
            break;
          case 1:
            newX = token.data.x + size * 2;
            newY = token.data.y + size;
            break;
        }
        token.data.x = newX;
        token.data.y = newY;
        await token.update({ width: 0.5, height: 0.5, x: newX, y: newY });
      }
    }
  } else {
    if (token.data.width === 0.5) {
      await token.update({ width: 1, height: 1 });
      const getSnapped: any = game?.canvas?.grid?.grid?.getSnappedPosition(token.data.x, token.data.y) || [0, 0];
      await token.update({ width: 1, height: 1, x: getSnapped.x, y: getSnapped.y });

      if (tokensInTheOldPos.length === 1) {
        for (let i = 0; i < tokensInTheOldPos.length; i++) {
          const token: TokenDocument = tokensInTheOldPos[i];
          if (token.data.width === 0.5) {
            token.data.width = 1;
            token.data.height = 1;
            await token.update({ width: 1, height: 1 });
            const getSnapped: any = game?.canvas?.grid?.grid?.getSnappedPosition(token.data.x, token.data.y) || [0, 0];
            await token.update({ x: getSnapped.x, y: getSnapped.y });
          }
        }
      }
    }
  }
}
