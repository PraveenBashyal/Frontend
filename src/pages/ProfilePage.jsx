import { useState, useEffect, useCallback } from 'react'
import Layout from '../components/ui/Layout'
import { fetchProfile, updateProfile, changePassword, USE_MOCK } from '../data'
import {
  PASSWORD_MIN, PASSWORD_MAX,
  checkName, checkEmail, checkPassword, checkPasswordMatch,
  checkPhone, checkDateOfBirth, collectErrors,
} from '../lib/validation'

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // See the note in DashboardPage
  const loadProfile = useCallback(async () => {
    try {
      setProfile(await fetchProfile())
      setError(null)
    } catch (err) {
      setError(`Failed to load profile: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadProfile() }, [loadProfile])

  return (
    <Layout>
      <div className="page-header">
        <div className="page-title">Profile</div>
        <div className="page-sub">Your account details and password</div>
      </div>

      {error && <div className="state-error">{error}</div>}

      {loading ? (
        <div className="state-loading">Loading profile...</div>
      ) : profile ? (
        <div className="stack">
          <AccountDetails profile={profile} onSaved={setProfile} />
          <ChangePassword />
        </div>
      ) : null}
    </Layout>
  )
}

// ─── Account details ──────────────────────────────────────────
function AccountDetails({ profile, onSaved }) {
  const [form,    setForm]    = useState(profile)
  const [errors,  setErrors]  = useState({})
  const [saving,  setSaving]  = useState(false)
  const [failure, setFailure] = useState(null)
  const [saved,   setSaved]   = useState(false)

  // Enable Save only once something actually differs
  const dirty = Object.keys(form).some(key => form[key] !== profile[key])

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => (prev[field] ? { ...prev, [field]: undefined } : prev))
    setSaved(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const found = collectErrors({
      firstName:   checkName(form.firstName),
      lastName:    checkName(form.lastName),
      email:       checkEmail(form.email),
      phoneNumber: checkPhone(form.phoneNumber),
      dateOfBirth: checkDateOfBirth(form.dateOfBirth),
    })

    if (Object.keys(found).length) {
      setErrors(found)
      setFailure(null)
      return
    }

    try {
      setSaving(true)
      setErrors({})
      setFailure(null)

      const updated = await updateProfile(form)
      onSaved(updated)
      setForm(updated)
      setSaved(true)

    } catch (err) {
      setFailure(err.message || 'Could not save changes')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setForm(profile)
    setErrors({})
    setFailure(null)
    setSaved(false)
  }

  return (
    <form className="panel form-section" onSubmit={handleSubmit} noValidate>
      <div className="form-section__title">Account details</div>

      {saved   && <div className="state-success">Changes saved.</div>}
      {failure && <div className="state-error">{failure}</div>}

      <div className="field">
        <label className="field__label">Username</label>
        <input className="field__input" value={form.username} disabled readOnly />
        <div className="field__hint">
          Your login handle — it cannot be changed
        </div>
      </div>

      <div className="field-row">
        <Field
          label="First name" required
          value={form.firstName} error={errors.firstName}
          onChange={v => update('firstName', v)}
        />
        <Field
          label="Last name" required
          value={form.lastName} error={errors.lastName}
          onChange={v => update('lastName', v)}
        />
      </div>

      <Field
        label="Email" type="email" required
        value={form.email} error={errors.email}
        onChange={v => update('email', v)}
      />

      <div className="field-row">
        <Field
          label="Phone number"
          value={form.phoneNumber} error={errors.phoneNumber}
          onChange={v => update('phoneNumber', v)}
          placeholder="Optional"
        />
        <Field
          label="Date of birth" type="date"
          value={form.dateOfBirth} error={errors.dateOfBirth}
          onChange={v => update('dateOfBirth', v)}
        />
      </div>

      {profile.createdAt && (
        <div className="form-section__meta">
          Member since {new Date(profile.createdAt).toLocaleDateString()}
        </div>
      )}

      <div className="form-section__actions">
        <button
          className="btn btn--outline"
          type="button"
          onClick={handleReset}
          disabled={!dirty || saving}
        >
          Discard
        </button>
        <button
          className="btn btn--primary"
          type="submit"
          disabled={!dirty || saving}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

// ─── Change password ──────────────────────────────────────────
function ChangePassword() {
  const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' }

  const [form,    setForm]    = useState(EMPTY)
  const [errors,  setErrors]  = useState({})
  const [saving,  setSaving]  = useState(false)
  const [failure, setFailure] = useState(null)
  const [done,    setDone]    = useState(false)

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => (prev[field] ? { ...prev, [field]: undefined } : prev))
    setDone(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const found = collectErrors({
      currentPassword: form.currentPassword ? null : 'Required',
      newPassword:     checkPassword(form.newPassword),
      confirmPassword: checkPasswordMatch(form.newPassword, form.confirmPassword),
    })

    if (Object.keys(found).length) {
      setErrors(found)
      setFailure(null)
      return
    }

    try {
      setSaving(true)
      setErrors({})
      setFailure(null)

      await changePassword(form)
      setForm(EMPTY)
      setDone(true)

    } catch (err) {
      setFailure(err.message || 'Could not change password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="panel form-section" onSubmit={handleSubmit} noValidate>
      <div className="form-section__title">Change password</div>

      {USE_MOCK && (
        <div className="state-notice">
          Mock mode — any current password works except "wrong", which is
          rejected so you can see the error state.
        </div>
      )}

      {done    && <div className="state-success">Password updated.</div>}
      {failure && <div className="state-error">{failure}</div>}

      <Field
        label="Current password" type="password" required
        value={form.currentPassword} error={errors.currentPassword}
        onChange={v => update('currentPassword', v)}
      />

      <div className="field-row">
        <Field
          label="New password" type="password" required
          value={form.newPassword} error={errors.newPassword}
          onChange={v => update('newPassword', v)}
          hint={`${PASSWORD_MIN}–${PASSWORD_MAX} characters`}
        />
        <Field
          label="Confirm new password" type="password" required
          value={form.confirmPassword} error={errors.confirmPassword}
          onChange={v => update('confirmPassword', v)}
        />
      </div>

      <div className="form-section__actions">
        <button className="btn btn--primary" type="submit" disabled={saving}>
          {saving ? 'Updating…' : 'Update password'}
        </button>
      </div>
    </form>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder, error, hint, required }) {
  return (
    <div className="field">
      <label className="field__label">
        {label}{required ? ' *' : ''}
      </label>
      <input
        className={`field__input${error ? ' field__input--invalid' : ''}`}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
      />
      {error
        ? <div className="field__hint text-down">{error}</div>
        : hint && <div className="field__hint">{hint}</div>}
    </div>
  )
}
