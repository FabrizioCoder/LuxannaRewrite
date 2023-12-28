import { AutoLoad, Command, Declare } from '@potoland/core';

@Declare({
  name: 'account',
  description: 'Account management commands',
})
@AutoLoad()
export default class DevCommand extends Command { }
