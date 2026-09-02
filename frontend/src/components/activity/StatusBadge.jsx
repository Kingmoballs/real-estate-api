import {
  formatStatus,
  getStatusTone,
} from '../../features/activity/activityFormatters.js'

function StatusBadge({ status }) {
  return (
    <span
      className={
        'inline-flex rounded-full px-3 py-1.5 text-xs font-extrabold ' +
        getStatusTone(status)
      }
    >
      {formatStatus(status)}
    </span>
  )
}

export default StatusBadge
