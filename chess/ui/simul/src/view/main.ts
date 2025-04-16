import { onInsert, looseH as h } from 'lib/snabbdom';
import type SimulCtrl from '../ctrl';
import { title } from './util';
import created from './created';
import { richHTML } from 'lib/richText';
import results from './results';
import pairings from './pairings';
import { initMiniGames } from 'lib/view/miniBoard';
import { watchers } from 'lib/view/watchers';
import standaloneChat from 'lib/chat/standalone';

export default function (ctrl: SimulCtrl) {
  const handler = ctrl.data.isRunning ? started : ctrl.data.isFinished ? finished : created(showText);

  return h('main.simul', { class: { 'simul-created': ctrl.data.isCreated } }, [
    h('aside.simul__side', {
      hook: onInsert(el => {
        $(el).replaceWith(ctrl.opts.$side);
        if (ctrl.opts.chat) {
          ctrl.opts.chat.data.hostIds = [ctrl.data.host.id];
          standaloneChat(ctrl.opts.chat);
        }
      }),
    }),
    h('div.simul__main.box', { hook: { postpatch: () => initMiniGames() } }, handler(ctrl)),
    h('div.chat__members.none', { hook: onInsert(watchers) }),
  ]);
}

const showText = (ctrl: SimulCtrl) =>
  ctrl.data.text.length > 0 && h('div.simul-text', [h('p', { hook: richHTML(ctrl.data.text) })]);

const started = (ctrl: SimulCtrl) => [
  h('div.box__top', title(ctrl)),
  showText(ctrl),
  results(ctrl),
  pairings(ctrl),
];

const finished = (ctrl: SimulCtrl) => [
  h('div.box__top', [title(ctrl), h('div.box__top__actions', h('div.finished', i18n.site.finished))]),
  showText(ctrl),
  results(ctrl),
  pairings(ctrl),
];
