import { useQuery } from '@tanstack/react-query'
import { Shield, MapPin, Users, Building2, Award, Mail, Globe, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/lib/api'

interface Organization {
  id: string
  name: string
  legalName: string
  type: string
  status: string
  verificationLevel: string
  trustScore: number
  description: string
  registrationNumber: string
  taxId: string
  website: string
  email: string
  phone: string
  address: string
  city: string
  countryCode: string
  employeeCount: string
  foundedYear: number
  annualCapacity: string
}

interface Member {
  id: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
  role: string
  isPrimaryContact: boolean
}

export function OrganizationPage() {
  const { data: org } = useQuery<Organization>({
    queryKey: ['my-organization'],
    queryFn: async () => {
      // Try to get the user's primary organization
      const res = await api.get('/organizations?limit=1')
      return res.data.items?.[0]
    },
  })

  const { data: membersData } = useQuery<{ items: Member[] }>({
    queryKey: ['org-members', org?.id],
    queryFn: async () => {
      if (!org?.id) return { items: [] }
      const res = await api.get(`/organizations/${org.id}/members`)
      return { items: res.data }
    },
    enabled: !!org?.id,
  })

  const members = membersData?.items || []

  const verificationItems = [
    { label: 'Business Registration', status: org?.verificationLevel !== 'none' ? 'verified' : 'pending' },
    { label: 'Physical Site Verified', status: ['full', 'enhanced'].includes(org?.verificationLevel || '') ? 'verified' : 'pending' },
    { label: 'Banking Verified', status: org?.verificationLevel !== 'none' ? 'verified' : 'pending' },
    { label: 'Trade References', status: ['enhanced'].includes(org?.verificationLevel || '') ? 'verified' : 'pending' },
    { label: 'Certification', status: 'pending' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organization Profile</h1>
        <p className="text-gray-600 mt-1">Manage your company profile and verification status</p>
      </div>

      {/* Header Card */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">{org?.name || 'Loading...'}</h2>
                <span className={cn(
                  'badge flex items-center gap-1',
                  org?.verificationLevel === 'full' || org?.verificationLevel === 'enhanced'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                )}>
                  <Shield className="w-3 h-3" />
                  {org?.verificationLevel === 'full' || org?.verificationLevel === 'enhanced'
                    ? 'Fully Verified'
                    : 'Verification Pending'}
                </span>
              </div>
              <p className="text-gray-500 mt-1 capitalize">
                {org?.type || 'Organization'} · {org?.countryCode || ''} · {org?.foundedYear ? `Since ${org.foundedYear}` : ''}
              </p>
              <div className="flex gap-4 mt-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{org?.trustScore || 0}</p>
                  <p className="text-xs text-gray-500">Trust Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{members.length}</p>
                  <p className="text-xs text-gray-500">Members</p>
                </div>
              </div>
            </div>
          </div>
          <button className="btn-secondary">Edit Profile</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Details */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Details</h3>
          <div className="space-y-3">
            {org?.registrationNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600">Registration Number</span>
                <span className="font-medium">{org.registrationNumber}</span>
              </div>
            )}
            {org?.taxId && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tax ID</span>
                <span className="font-medium">{org.taxId}</span>
              </div>
            )}
            {org?.employeeCount && (
              <div className="flex justify-between">
                <span className="text-gray-600">Employees</span>
                <span className="font-medium">{org.employeeCount}</span>
              </div>
            )}
            {org?.annualCapacity && (
              <div className="flex justify-between">
                <span className="text-gray-600">Annual Capacity</span>
                <span className="font-medium">{org.annualCapacity}</span>
              </div>
            )}
            <div className="flex items-center gap-2 pt-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {org ? `${org.address || ''}, ${org.city || ''}, ${org.countryCode || ''}` : 'Address not set'}
              </span>
            </div>
            {org?.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{org.email}</span>
              </div>
            )}
            {org?.website && (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline">
                  {org.website}
                </a>
              </div>
            )}
            {org?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{org.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Verification Badges */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
          <div className="space-y-3">
            {verificationItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-gray-700">{item.label}</span>
                {item.status === 'verified' ? (
                  <span className="badge bg-green-100 text-green-800 flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Verified
                  </span>
                ) : (
                  <span className="badge bg-amber-100 text-amber-800">Pending Review</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
          <button className="btn-secondary text-sm">Invite Member</button>
        </div>
        <div className="space-y-3">
          {members.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No team members yet</p>
          ) : (
            members.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.user?.firstName} {member.user?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{member.user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 capitalize">{member.role.replace('_', ' ')}</span>
                  {member.isPrimaryContact && (
                    <span className="badge bg-primary-100 text-primary-700 text-xs">Primary</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
