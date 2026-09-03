import './password.css'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy } from 'lucide-react'

const LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>?'

type Strength = 'weak' | 'fair' | 'strong' | 'insane'

function getCharset(letters: boolean, digits: boolean, symbols: boolean) {
  return `${letters ? LETTERS : ''}${digits ? DIGITS : ''}${symbols ? SYMBOLS : ''}`
}

function getStrength(length: number, poolSize: number): Strength {
  if (poolSize === 0) return 'weak'
  const entropy = length * Math.log2(poolSize)
  if (entropy < 40) return 'weak'
  if (entropy < 60) return 'fair'
  if (entropy < 80) return 'strong'
  return 'insane'
}

function randomPassword(length: number, charset: string) {
  if (!charset) return ''
  const values = new Uint32Array(length)
  crypto.getRandomValues(values)
  return Array.from(values, (value) => charset[value % charset.length]).join('')
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      className={`pass-toggle ${checked ? 'is-on' : ''}`}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="pass-toggle-label">{label}</span>
      <span className="pass-toggle-track" aria-hidden="true">
        <span className="pass-toggle-thumb" />
      </span>
    </button>
  )
}

export function PasswordApp() {
  const { t } = useTranslation()
  const [letters, setLetters] = useState(true)
  const [digits, setDigits] = useState(true)
  const [symbols, setSymbols] = useState(false)
  const [length, setLength] = useState(16)
  const [password, setPassword] = useState('')
  const [copied, setCopied] = useState(false)

  const charset = useMemo(
    () => getCharset(letters, digits, symbols),
    [letters, digits, symbols],
  )
  const strength = getStrength(length, charset.length)
  const strengthFill = { weak: 25, fair: 50, strong: 75, insane: 100 }[strength]

  const generate = useCallback(() => {
    setPassword(randomPassword(length, charset))
    setCopied(false)
  }, [length, charset])

  useEffect(() => {
    generate()
  }, [generate])

  const guardLast = (key: 'letters' | 'digits' | 'symbols', next: boolean) => {
    const nextState = { letters, digits, symbols, [key]: next }
    if (!nextState.letters && !nextState.digits && !nextState.symbols) return
    if (key === 'letters') setLetters(next)
    if (key === 'digits') setDigits(next)
    if (key === 'symbols') setSymbols(next)
  }

  const copyPassword = async () => {
    if (!password) return
    await navigator.clipboard.writeText(password)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="pass-app">
      <div className="pass-panel">
        <header className="pass-header">
          <p className="pass-kicker">{t('password.kicker')}</p>
          <h1 className="pass-title">{t('password.title')}</h1>
          <p className="pass-subtitle">{t('password.subtitle')}</p>
        </header>

        <div className="pass-output">
          <div className="pass-output-head">
            <p className="pass-output-label">{t('password.result')}</p>
            <button
              type="button"
              className={`pass-copy-icon ${copied ? 'is-copied' : ''}`}
              onClick={copyPassword}
              disabled={!password}
              aria-label={copied ? t('password.copied') : t('password.copy')}
              title={copied ? t('password.copied') : t('password.copy')}
            >
              {copied ? <Check size={18} strokeWidth={2.4} /> : <Copy size={18} strokeWidth={2.2} />}
            </button>
          </div>
          <p className="pass-value">{password || '—'}</p>
        </div>

        <div className="pass-strength">
          <div className="pass-strength-row">
            <span>{t('password.strength')}</span>
            <span className={`pass-strength-label is-${strength}`}>
              {t(`password.levels.${strength}`)}
            </span>
          </div>
          <div className="pass-strength-track">
            <span
              className={`pass-strength-fill is-${strength}`}
              style={{ width: `${strengthFill}%` }}
            />
          </div>
        </div>

        <label className="pass-length">
          <span className="pass-length-row">
            <span>{t('password.length')}</span>
            <span className="pass-length-value">{length}</span>
          </span>
          <input
            className="pass-slider"
            type="range"
            min={8}
            max={48}
            value={length}
            onChange={(event) => setLength(Number(event.target.value))}
          />
        </label>

        <div className="pass-toggles">
          <Toggle
            checked={letters}
            label={t('password.letters')}
            onChange={(next) => guardLast('letters', next)}
          />
          <Toggle
            checked={digits}
            label={t('password.digits')}
            onChange={(next) => guardLast('digits', next)}
          />
          <Toggle
            checked={symbols}
            label={t('password.symbols')}
            onChange={(next) => guardLast('symbols', next)}
          />
        </div>

        <div className="pass-actions">
          <button type="button" className="pass-btn pass-btn-ghost" onClick={copyPassword}>
            {copied ? t('password.copied') : t('password.copy')}
          </button>
          <button type="button" className="pass-btn pass-btn-main" onClick={generate}>
            {t('password.generate')}
          </button>
        </div>
      </div>
    </div>
  )
}
