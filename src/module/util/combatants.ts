import { MODULE_NAME } from './constants';
function getPriority(user: User, actor: Actor) {
  let priority = 0;
  if (user.character === actor) priority += 100;
  if (actor.testUserPermission(user, 'OWNER')) priority += 10;
  if (user.isGM) priority -= 1;
  if (!user.active) priority -= 1000;
  return priority;
}
export function getUserFromCombatant(combatant: Combatant): User {
  combatant?.token?.unsetFlag(MODULE_NAME, 'combatRoundMovement');
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const priorities = new Map(game.users.map((user) => [user, getPriority(user, combatant.token)]));
  const maxPriority = Math.max(...priorities.values());
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return game.users.find((user) => priorities.get(user) === maxPriority);
}
