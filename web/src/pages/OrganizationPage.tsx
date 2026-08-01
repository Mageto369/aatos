import { Shield, MapPin, Users, Building2, Award } from 'lucide-react'

export function OrganizationPage() {
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
                <h2 className="text-xl font-bold text-gray-900">Nairobi Coffee Exporters Ltd</h2>
                <span className="badge-success flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Fully Verified
                </span>
              </div>
              <p className="text-gray-500 mt-1">Exporter · Kenya · Since 2015</p>
              <div className="flex gap-4 mt-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">87</p>
                  <p className="text-xs text-gray-500">Trust Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">47</p>
                  <p className="text-xs text-gray-500">Deals</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">12</p>
                  <p className="text-xs text-gray-500">Products</p>
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
            <div className="flex justify-between">
              <span className="text-gray-600">Registration Number</span>
              <span className="font-medium">BRN-KE-2018-001234</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax ID</span>
              <span className="font-medium">TIN-KE-987654321</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Employees</span>
              <span className="font-medium">11-50</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Annual Capacity</span>
              <span className="font-medium">5,000 MT</span>
            </div>
            <div className="flex items-start gap-2 pt-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <span className="text-sm text-gray-600">123 Mombasa Road, Industrial Area, Nairobi, Kenya</span>
            </div>
          </div>
        </div>

        {/* Verification Badges */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
          <div className="space-y-3">
            {[
              { label: 'Business Registration', status: 'verified' },
              { label: 'Physical Site Verified', status: 'verified' },
              { label: 'Banking Verified', status: 'verified' },
              { label: 'Trade References', status: 'verified' },
              { label: 'Organic Certification', status: 'pending' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-gray-700">{item.label}</span>
                {item.status === 'verified' ? (
                  <span className="badge-success flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Verified
                  </span>
                ) : (
                  <span className="badge-warning">Pending Review</span>
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
          {[
            { name: 'Jane Doe', role: 'Owner', email: 'jane@nairobicoffee.co.ke' },
            { name: 'John Smith', role: 'Operations Manager', email: 'john@nairobicoffee.co.ke' },
            { name: 'Sarah Kimani', role: 'Compliance Officer', email: 'sarah@nairobicoffee.co.ke' },
          ].map((member) => (
            <div key={member.email} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
              </div>
              <span className="text-sm text-gray-600">{member.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
