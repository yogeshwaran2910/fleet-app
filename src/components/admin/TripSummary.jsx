import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function TripSummary() {
  const [trips, setTrips] = useState([])
  const [drivers, setDrivers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    trip_id: '', driver_id: '', driver_name: '', contact_number: '',
    pickup_location: '', drop_location: '', advanced_needed: '',
    fuel_needed: '', vehicle_number: '', number_of_trips: 1,
    remarks: '', trip_date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [t, d, v] = await Promise.all([
      supabase.from('trips').select('*').order('created_at', { ascending: false }),
      supabase.from('drivers').select('*').order('driver_name'),
      supabase.from('vehicles').select('*').order('vehicle_number'),
    ])
    setTrips(t.data || [])
    setDrivers(d.data || [])
    setVehicles(v.data || [])
    setLoading(false)
  }

  const handleDriverChange = (driverId) => {
    const d = drivers.find(x => x.id === driverId)
    setForm(p => ({ ...p, driver_id: driverId, driver_name: d?.driver_name || '', contact_number: d?.contact_number || '' }))
  }

  const generateTripId = () => {
    const d = new Date()
    return `TRIP-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Math.floor(Math.random()*9000)+1000}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error } = await supabase.from('trips').insert([{
      ...form,
      trip_id: form.trip_id || generateTripId(),
      advanced_needed: parseFloat(form.advanced_needed) || 0,
      fuel_needed: parseFloat(form.fuel_needed) || 0,
      number_of_trips: parseInt(form.number_of_trips) || 1,
    }])
    if (error) { setError(error.message); setSaving(false); return }
    setShowForm(false)
    setForm({ trip_id: '', driver_id: '', driver_name: '', contact_number: '',
      pickup_location: '', drop_location: '', advanced_needed: '', fuel_needed: '',
      vehicle_number: '', number_of_trips: 1, remarks: '',
      trip_date: new Date().toISOString().split('T')[0] })
    fetchAll()
    setSaving(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Trip Summary</h2>
          <p className="text-gray-500 text-sm">{trips.length} total trips</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
          + Add Trip
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Trip ID','Driver / Contact','Pickup','Drop','Advance (₹)','Fuel (₹)','Vehicle No.','Driver ID','# Trips','Remarks'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-16 text-gray-400">Loading trips...</td></tr>
              ) : trips.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-16 text-gray-400">
                  No trips yet. Click "+ Add Trip" to create one.
                </td></tr>
              ) : trips.map((trip, i) => (
                <tr key={trip.id} className={`border-b border-gray-100 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                  <td className="px-4 py-3 font-mono text-blue-600 font-medium text-xs">{trip.trip_id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{trip.driver_name || '—'}</div>
                    <div className="text-gray-400 text-xs">{trip.contact_number}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-[140px] truncate">{trip.pickup_location}</td>
                  <td className="px-4 py-3 text-gray-700 max-w-[140px] truncate">{trip.drop_location}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">₹{trip.advanced_needed || 0}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">₹{trip.fuel_needed || 0}</td>
                  <td className="px-4 py-3 text-gray-700">{trip.vehicle_number || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{trip.driver_id?.slice(0,8) || '—'}...</td>
                  <td className="px-4 py-3 text-gray-700 text-center">{trip.number_of_trips}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate">{trip.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-900">Add New Trip</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trip ID <span className="text-gray-400 font-normal text-xs">(auto if blank)</span></label>
                  <input type="text" value={form.trip_id} onChange={e => setForm({...form, trip_id: e.target.value})}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. TRIP-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trip Date</label>
                  <input type="date" value={form.trip_date} onChange={e => setForm({...form, trip_date: e.target.value})}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Driver</label>
                  <select value={form.driver_id} onChange={e => handleDriverChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Select Driver --</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.driver_name} ({d.contact_number})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Vehicle</label>
                  <select value={form.vehicle_number} onChange={e => setForm({...form, vehicle_number: e.target.value})}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Select Vehicle --</option>
                    {vehicles.map(v => <option key={v.id} value={v.vehicle_number}>{v.vehicle_number} ({v.vehicle_id})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location *</label>
                  <input type="text" value={form.pickup_location} onChange={e => setForm({...form, pickup_location: e.target.value})}
                    required className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Chennai Port" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Drop Location *</label>
                  <input type="text" value={form.drop_location} onChange={e => setForm({...form, drop_location: e.target.value})}
                    required className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Bangalore Depot" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Advance Needed (₹)</label>
                  <input type="number" value={form.advanced_needed} onChange={e => setForm({...form, advanced_needed: e.target.value})}
                    min="0" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Needed (₹)</label>
                  <input type="number" value={form.fuel_needed} onChange={e => setForm({...form, fuel_needed: e.target.value})}
                    min="0" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Trips</label>
                  <input type="number" value={form.number_of_trips} onChange={e => setForm({...form, number_of_trips: e.target.value})}
                    min="1" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <textarea value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})}
                    rows={3} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Any extra notes about this trip..." />
                </div>
              </div>
              {error && <p className="text-red-500 text-sm mt-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-xl py-3 text-sm font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Create Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}