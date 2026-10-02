# User/Admin roles setup

LOKI reads account roles from `public.app_users`. New accounts receive the `user` role from a Supabase Auth trigger. The browser cannot directly write roles; an administrator updates roles through the `set_loki_user_role` RPC, which checks the caller's role in the database.

## Apply the Supabase schema

1. Open the Supabase SQL Editor for the LOKI project.
2. Run the full script in [supabase/admin_roles.sql](../supabase/admin_roles.sql).
3. Create your account through LOKI Sign up if it does not already exist.
4. In SQL Editor, replace the email below with your account email and run it once:

```sql
update public.app_users
set role = 'admin'
where lower(email) = lower('YOUR_EMAIL');

select id, email, role
from public.app_users
where lower(email) = lower('YOUR_EMAIL');
```

5. Sign out and sign back in. The account menu should show Administrator and Admin console.

All other accounts remain `user`. The admin console can list accounts and change roles, but cannot change the current administrator's own role. Row-level security prevents ordinary users from listing accounts or invoking admin role changes.
