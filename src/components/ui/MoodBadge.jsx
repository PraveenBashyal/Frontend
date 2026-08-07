import { toneClass } from '../../data'

export default function MoodBadge({ mood }) {
  return (
    <span className={`badge ${toneClass(mood)}`}>
      {mood || 'No data'}
    </span>
  )
}
