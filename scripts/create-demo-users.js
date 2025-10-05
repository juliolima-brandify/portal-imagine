// scripts/create-demo-users.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const demoUsers = [
  {
    email: 'admin@demo.com',
    password: 'demo123',
    name: 'Admin Demo',
    role: 'admin'
  },
  {
    email: 'doador@demo.com', 
    password: 'demo123',
    name: 'Doador Demo',
    role: 'donor'
  },
  {
    email: 'voluntario@demo.com',
    password: 'demo123', 
    name: 'Voluntário Demo',
    role: 'volunteer'
  }
];

async function createDemoUsers() {
  console.log('🚀 Criando usuários demo...\n');

  for (const user of demoUsers) {
    try {
      console.log(`📝 Criando usuário: ${user.email} (${user.role})`);
      
      // Criar usuário no auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Confirmar email automaticamente
        user_metadata: {
          name: user.name,
          role: user.role
        }
      });

      if (authError) {
        if (authError.message.includes('User already registered')) {
          console.log(`⚠️  Usuário ${user.email} já existe - pulando...`);
          continue;
        }
        throw authError;
      }

      // Criar perfil na tabela profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error(`❌ Erro ao criar perfil para ${user.email}:`, profileError.message);
        // Continuar mesmo com erro de perfil
      }

      console.log(`✅ Usuário ${user.email} criado com sucesso!`);
      
    } catch (error) {
      console.error(`❌ Erro ao criar usuário ${user.email}:`, error.message);
    }
  }

  console.log('\n🎉 Processo concluído!');
  console.log('\n📋 Credenciais dos usuários demo:');
  console.log('Admin: admin@demo.com / demo123');
  console.log('Doador: doador@demo.com / demo123');
  console.log('Voluntário: voluntario@demo.com / demo123');
}

createDemoUsers().catch(console.error);
