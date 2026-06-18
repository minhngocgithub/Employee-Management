const fs = require('fs')
const { ObjectId } = require('mongodb')

const PASSWORD_HASH =
  '$2b$10$K/uGpXRVpzCN/OsVcP3vi.7QA.2aCHhlNgCe2cjYcA.chg4Ik7j7O'

const DEPARTMENTS = [
  '6a2b89366326df15186c55bb', // IT
  '6a3110ccb217f8057bdb4b2a', // HR
  '6a311108b217f8057bdb4b2b', // TC
]

const employees = []
const accounts = []

for (let i = 1; i <= 1000; i++) {
  const employeeId = new ObjectId()
  const accountId = new ObjectId()

  const departmentId =
    DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)]

  const employeeCode = `EMP${String(i).padStart(4, '0')}`

  employees.push({
    _id: {
      $oid: employeeId.toString(),
    },
    account_id: {
      $oid: accountId.toString(),
    },
    full_name: `Employee ${i}`,
    personal_email: `employee${i}@gmail.com`,
    employee_code: employeeCode,
    phone: `090${String(i).padStart(7, '0')}`,
    avatar_url: null,
    date_of_birth: null,
    gender: null,
    address: null,
    position: 'Nhân viên',
    department_id: {
      $oid: departmentId,
    },
    join_date: {
      $date: new Date().toISOString(),
    },
    end_date: null,
    status: 'active',
    createdAt: {
      $date: new Date().toISOString(),
    },
    updatedAt: {
      $date: new Date().toISOString(),
    },
  })

  accounts.push({
    _id: {
      $oid: accountId.toString(),
    },
    email: `employee${i}@company.com`,
    password_hash: PASSWORD_HASH,
    role: 'employee',
    employee_id: {
      $oid: employeeId.toString(),
    },
    department_id: {
      $oid: departmentId,
    },
    is_active: true,
    is_first_login: false,
    refresh_token_hash: null,
    createdAt: {
      $date: new Date().toISOString(),
    },
    updatedAt: {
      $date: new Date().toISOString(),
    },
  })
}

fs.writeFileSync(
  'employees.json',
  JSON.stringify(employees, null, 2),
)

fs.writeFileSync(
  'accounts.json',
  JSON.stringify(accounts, null, 2),
)

console.log('Generated:')
console.log(`Employees: ${employees.length}`)
console.log(`Accounts : ${accounts.length}`)
console.log('Files:')
console.log('- employees.json')
console.log('- accounts.json')