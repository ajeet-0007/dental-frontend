import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, Monitor, Smartphone, Tablet, User, Clock, CornerDownRight,
} from 'lucide-react'
import { pageVisitsApi, VisitorJourney } from '../../api/pageVisits'

const DEVICE_ICONS: Record<string, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
}

export default function AdminVisitorJourney() {
  const { visitorId = '' } = useParams()

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-page-visit-journey', visitorId],
    queryFn: () => pageVisitsApi.getVisitorJourney(visitorId),
    enabled: !!visitorId,
  })

  const journey: VisitorJourney | undefined = data?.data

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            to="/admin/page-visits?tab=visitors"
            className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Page Visits
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Visitor Journey</h1>
          <p className="text-sm text-gray-500 mt-1 font-mono" title={visitorId}>
            {visitorId}
          </p>
        </div>
        {journey && (
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-600">{journey.visitCount}</p>
            <p className="text-sm text-gray-500">total visits</p>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          Loading journey...
        </div>
      ) : error || !journey ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          No visits found for this visitor.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500 mb-1">User</p>
              {journey.user ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
                    {journey.user.firstName?.[0] || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {journey.user.firstName} {journey.user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{journey.user.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-400">
                  <User className="w-4 h-4" />
                  <span className="text-sm">Anonymous visitor</span>
                </div>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500 mb-1">First Seen</p>
              <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-400" />
                {formatDate(journey.firstSeen)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500 mb-1">Last Seen</p>
              <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-400" />
                {formatDate(journey.lastSeen)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-700 mb-6">Pages visited (in order)</p>
            <ol className="relative border-l border-gray-200 ml-3 space-y-6">
              {journey.visits.map((visit, index) => {
                const DeviceIcon = DEVICE_ICONS[visit.deviceType] || Monitor
                return (
                  <li key={visit.id} className="ml-6">
                    <span className="absolute -left-[9px] flex items-center justify-center w-4 h-4 rounded-full bg-primary-100 ring-4 ring-white">
                      <span className="w-2 h-2 rounded-full bg-primary-600" />
                    </span>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase">#{index + 1}</span>
                        <a
                          href={visit.path}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-gray-900 hover:text-primary-600 font-mono"
                        >
                          {visit.path}
                        </a>
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <DeviceIcon className="w-3 h-3" />
                          {visit.deviceType}
                        </span>
                      </div>
                      {visit.pageTitle && (
                        <p className="text-xs text-gray-500">{visit.pageTitle}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        {formatDate(visit.createdAt)}
                        {index > 0 && (
                          <span className="inline-flex items-center gap-1 ml-2">
                            <CornerDownRight className="w-3 h-3" />
                            came from{' '}
                            <span className="font-mono">{journey.visits[index - 1].path}</span>
                          </span>
                        )}
                        {index === 0 && visit.referrer && (
                          <span className="ml-2">via {visit.referrer}</span>
                        )}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </>
      )}
    </div>
  )
}
