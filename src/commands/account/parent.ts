import { Command, Declare, Options } from '@potoland/core';
import LinkCommand from './link';

@Declare({
  name: 'account',
  description: 'Account management commands',
})
@Options([LinkCommand])
export default class DevCommand extends Command {}
