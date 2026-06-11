import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    })
  }

  const { user_id, new_password } = await req.json()
  if (!user_id || !new_password) {
    return new Response(JSON.stringify({ error: 'Missing user_id or new_password' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  const { error } = await supabase.auth.admin.updateUserById(user_id, {
    password: new_password,
  })
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  })
})
