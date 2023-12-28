import { Command, Declare, Middlewares, Options } from '@potoland/core';
import DeferReply from '../../middlewares/deferReply';
import RankedCommand from './ranked';

@Declare({
  name: 'summoner',
  description: 'Summoner things',
})
@Middlewares([DeferReply])
@Options([RankedCommand])
export default class SummonerCommand extends Command {}
