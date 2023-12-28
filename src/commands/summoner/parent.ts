import { AutoLoad, Command, Declare, Middlewares } from '@potoland/core';
import DeferReply from '../../middlewares/deferReply';

@Declare({
  name: 'summoner',
  description: 'Summoner things',
})
@Middlewares([DeferReply])
@AutoLoad()
export default class SummonerCommand extends Command {}
