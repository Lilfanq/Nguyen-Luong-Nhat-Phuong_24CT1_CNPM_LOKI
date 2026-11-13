export async function saveConnectedDevicesToSupabase(supabaseClient, devices) {
  if (!supabaseClient || !Array.isArray(devices) || devices.length === 0) {
    return { ok: false, reason: 'no-devices' }
  }

  try {
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) return { ok: false, reason: 'not-authenticated' }

    const rows = devices
      .filter((device) => device?.key && Number.isInteger(device.vendorId) && Number.isInteger(device.productId))
      .map((device) => ({
        user_id: user.id,
        device_key: device.key,
        vendor_id: device.vendorId,
        product_id: device.productId,
        product_name: device.productName || 'Unknown HID device',
        manufacturer_name: device.manufacturerName || '',
        device_type: device.deviceType || 'other',
        last_connected_at: new Date().toISOString(),
      }))

    if (rows.length === 0) return { ok: false, reason: 'invalid-device-data' }

    const { error } = await supabaseClient
      .from('user_devices')
      .upsert(rows, { onConflict: 'user_id,device_key' })

    return error ? { ok: false, reason: error.code || 'database-error' } : { ok: true, count: rows.length }
  } catch {
    return { ok: false, reason: 'request-failed' }
  }
}
