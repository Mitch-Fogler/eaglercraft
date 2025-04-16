import { h, type VNode } from 'snabbdom';
import { onInsert, type MaybeVNodes } from 'lib/snabbdom';
import * as created from './created';
import * as started from './started';
import * as finished from './finished';
import { joinWithTeamSelector } from './battle';
import type TournamentController from '../ctrl';
import { watchers } from 'lib/view/watchers';
import standaloneChat from 'lib/chat/standalone';

export default function (ctrl: TournamentController) {
  let handler: {
    name: string;
    main(ctrl: TournamentController): MaybeVNodes;
    table(ctrl: TournamentController): VNode | undefined;
  };
  if (ctrl.data.isFinished) handler = finished;
  else if (ctrl.data.isStarted) handler = started;
  else handler = created;

  return h('main.' + ctrl.opts.classes, [
    h('aside.tour__side', {
      hook: onInsert(el => {
        const side = ctrl.opts.$side;
        $(el).replaceWith(side);
        side
          .toggleClass('collapsed', ctrl.collapsedDescription())
          .find('.disclosure')
          .on('click', () => {
            side.toggleClass('collapsed');
            ctrl.collapsedDescription(side.hasClass('collapsed'));
          });
        ctrl.opts.chat && standaloneChat(ctrl.opts.chat);
      }),
    }),
    h('div.tour__underchat', {
      hook: onInsert(el => $(el).replaceWith($('.tour__underchat.none').removeClass('none'))),
    }),
    handler.table(ctrl),
    h(
      'div.tour__main',
      h(
        'div.box.' + handler.name,
        { class: { 'tour__main-finished': ctrl.data.isFinished } },
        handler.main(ctrl),
      ),
    ),
    ctrl.opts.chat ? h('div.chat__members.none', { hook: onInsert(watchers) }) : null,
    ctrl.joinWithTeamSelector ? joinWithTeamSelector(ctrl) : null,
  ]);
}
