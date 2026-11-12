'use client';

// "Students like you" — other Folio students who opted in to being found and
// aim for the same universities or major. Opening a card opens their public
// profile, where their links (Telegram, LinkedIn…) are how you reach out.
// The student's own visibility switch lives at the bottom: listing is
// strictly opt-in and turns the public link on.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiPost } from '@/lib/auth';
import { isFirebaseConfigured } from '@/lib/firebase';
import { publishShare, DEFAULT_SHARE_OPTIONS } from '@/lib/share';
import { autoHeadline, avatarColor, initials } from '@/lib/profile-card';
import { track } from '@/lib/analytics';
import { useT } from '@/lib/i18n';
import Icon from '@/components/Icon';

export default function PeersCard({ p, meta, user, extras, synced }) {
  const { t } = useT();
  const [state, setState] = useState({ status: 'idle', peers: [] });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const listed = Boolean(meta?.shareId) && meta?.shareOptions?.listed === true;
  const key = JSON.stringify([p.shortlist || [], p.intendedMajor || '']);

  useEffect(() => {
    if (!user || !synced) return;
    let alive = true;
    setState((s) => ({ ...s, status: s.peers.length ? 'ok' : 'loading' }));
    const timer = setTimeout(() => {
      apiPost('/api/peers', { targets: p.shortlist || [], major: p.intendedMajor || '' })
        .then((d) => alive && setState({ status: 'ok', peers: d.peers || [] }))
        .catch(() => alive && setState({ status: 'error', peers: [] }));
    }, 400);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, user, synced]);

  async function toggle() {
    setErr('');
    if (!user) return;
    setBusy(true);
    try {
      const opts = { ...DEFAULT_SHARE_OPTIONS, ...(meta?.shareOptions || {}), listed: !listed };
      await publishShare(user, p, opts, meta?.shareId || null, extras);
      track(listed ? 'peers_unlisted' : 'peers_listed');
    } catch {
      setErr(t('Could not update sharing — try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card pe">
      <div className="pe-head">
        <Icon name="users" size={20} style={{ color: 'var(--primary)' }} />
        <h3>{t('Students like you')}</h3>
      </div>
      <p className="pe-sub-head">{t('Aiming for the same universities or major. Open a profile to reach out.')}</p>

      {!isFirebaseConfigured() ? null : !user ? (
        <div className="pe-empty">
          <p>{t('Sign in to see students aiming for the same universities.')}</p>
          <Link href="/login?next=/profile" className="btn btn-primary btn-sm">{t('Sign in')}</Link>
        </div>
      ) : state.status === 'loading' || state.status === 'idle' ? (
        <ul className="pe-list" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="pe-row pe-skel">
              <span className="pe-av" />
              <span className="pe-main">
                <span className="pe-line" style={{ width: '60%' }} />
                <span className="pe-line" style={{ width: '85%', marginTop: 8 }} />
              </span>
            </li>
          ))}
        </ul>
      ) : state.peers.length ? (
        <ul className="pe-list">
          {state.peers.map((x) => {
            const headline = x.headline || autoHeadline({ intendedMajor: x.major, targets: x.targetNames }, t);
            const why = x.sharedCount > 0 ? t('{n} shared targets', { n: x.sharedCount }) : x.sameMajor ? t('Same major') : '';
            return (
              <li key={x.shareId} className="pe-row">
                <span className="pe-av" style={{ background: avatarColor(x.name) }} aria-hidden>
                  {initials(x.name)}
                </span>
                <span className="pe-main">
                  <span className="pe-name">{x.name}</span>
                  {headline && <span className="pe-sub" title={headline}>{headline}</span>}
                  {why && <span className="pe-why">{why}</span>}
                </span>
                <a
                  href={`/p/${x.shareId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pe-btn"
                  onClick={() => track('peer_open', { shared: x.sharedCount })}
                  aria-label={t('Open {name}’s profile', { name: x.name })}
                >
                  <Icon name="user" size={16} />
                  {t('View')}
                </a>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="pe-empty">
          <p>
            {(p.shortlist || []).length
              ? t('Nobody with your targets has turned this on yet. Turn it on below — you will be the first others find.')
              : t('Add target universities to find students aiming for the same places.')}
          </p>
          {!(p.shortlist || []).length && (
            <Link href="/universities" className="btn btn-ghost btn-sm">{t('Choose universities')}</Link>
          )}
        </div>
      )}

      {user && isFirebaseConfigured() && (
        <div className="pe-vis">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="pe-vis-title">{t('Show me to students like me')}</div>
            <p className="pe-vis-note">
              {listed
                ? t('On. Students with similar targets can open your public profile. You can turn it off any time.')
                : t('Off. Turning it on publishes your profile by link (no essays) so students with similar targets can find you.')}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={listed}
            aria-label={t('Show me to students like me')}
            onClick={toggle}
            disabled={busy}
            className={`pe-switch${listed ? ' on' : ''}`}
          >
            <span />
          </button>
        </div>
      )}
      {err && <p className="error-text">{err}</p>}

      <style>{`
        .pe{padding:20px; border-radius:18px;}
        .pe-head{display:flex; align-items:center; gap:10px;}
        .pe-head h3{font-size:14px; font-weight:750; letter-spacing:.06em; text-transform:uppercase;}
        .pe-sub-head{font-size:13px; color:var(--muted); margin-top:6px; line-height:1.45;}
        .pe-list{list-style:none; margin:14px 0 0; padding:0; display:grid; grid-template-columns:minmax(0, 1fr); gap:8px;}
        .pe-row{display:flex; align-items:center; gap:12px; padding:10px 10px 10px 12px; border-radius:14px; background:var(--surface-2); border:1px solid var(--line);
          animation:rise .45s var(--ease) both; transition:border-color .2s, transform .3s var(--ease);}
        .pe-row:nth-child(2){animation-delay:.05s} .pe-row:nth-child(3){animation-delay:.1s} .pe-row:nth-child(4){animation-delay:.15s} .pe-row:nth-child(n+5){animation-delay:.2s}
        .pe-row:hover{border-color:var(--line-strong);}
        .pe-av{width:42px; height:42px; border-radius:999px; flex-shrink:0; display:grid; place-items:center; color:#fff; font-weight:700; font-size:15px; background:var(--line);}
        .pe-main{flex:1; min-width:0; display:block;}
        .pe-name{display:block; font-size:14.5px; font-weight:700; line-height:1.3; overflow-wrap:anywhere;}
        .pe-sub{display:block; font-size:12.5px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:1px;}
        .pe-why{display:inline-block; font-size:11.5px; font-weight:650; color:var(--primary-600); margin-top:3px;}
        .pe-btn{display:inline-flex; align-items:center; gap:6px; padding:7px 13px; border-radius:999px; background:var(--surface); border:1px solid var(--line);
          color:var(--primary-600); font-size:13.5px; font-weight:650; flex-shrink:0; box-shadow:0 1px 2px rgba(27,26,36,.05);
          transition:transform .25s var(--ease-spring), border-color .2s, box-shadow .25s;}
        .pe-btn:hover{border-color:var(--primary); box-shadow:0 4px 12px rgba(54,112,188,.15);}
        .pe-btn:active{transform:scale(.94);}
        .pe-skel .pe-av, .pe-line{background:linear-gradient(90deg, var(--line) 0%, var(--surface) 50%, var(--line) 100%); background-size:200% 100%; animation:shimmer 1.4s linear infinite;}
        .pe-line{display:block; height:10px; border-radius:6px;}
        .pe-empty{margin-top:14px; padding:14px; border:1px dashed var(--line-strong); border-radius:14px; background:var(--surface-2); display:grid; gap:10px; justify-items:start;}
        .pe-empty p{font-size:13.5px; color:var(--muted); line-height:1.5;}
        .pe-vis{display:flex; gap:12px; align-items:center; margin-top:16px; padding-top:14px; border-top:1px solid var(--line);}
        .pe-vis-title{font-size:14px; font-weight:650;}
        .pe-vis-note{font-size:12.5px; color:var(--muted); margin-top:2px; line-height:1.45;}
        .pe-switch{width:46px; height:26px; border-radius:999px; border:0; cursor:pointer; background:var(--line-strong); position:relative; flex-shrink:0; transition:background .25s var(--ease);}
        .pe-switch span{position:absolute; top:3px; left:3px; width:20px; height:20px; border-radius:999px; background:#fff; transition:left .3s var(--ease-spring); box-shadow:0 1px 3px rgba(0,0,0,.2);}
        .pe-switch.on{background:var(--good);}
        .pe-switch.on span{left:23px;}
        .pe-switch:disabled{opacity:.6; cursor:default;}
      `}</style>
    </section>
  );
}
