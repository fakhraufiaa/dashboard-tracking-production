import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const usersData = [
    { name: "Yovi Widayanti Hidayat", uniqCode: 1, role: Role.OPT },
    { name: "Irgi Fazri Fahrezi", uniqCode: 2, role: Role.OPT },
    { name: "Fitri Nurhaeni", uniqCode: 3, role: Role.OPT },
    { name: "Fadila Rahmasari", uniqCode: 4, role: Role.OPT },
    { name: "Miftha Husyifa", uniqCode: 5, role: Role.OPT },
    { name: "Fatihatul Faidah", uniqCode: 6, role: Role.OPT },
    { name: "Wesa Setra Bumi", uniqCode: 7, role: Role.OPT },
    { name: "Fakhra Aufia", uniqCode: 8, role: Role.ADMIN },
    { name: "Iqbal Muhamad Fadilah", uniqCode: 9, role: Role.SCM },
    { name: "Ade Elan", uniqCode: 54, role: Role.SCM },
    { name: "SANDI JULIANA", uniqCode: 11, role: Role.OPT },
    { name: "ENDANG RUSTIAWAN", uniqCode: 12, role: Role.OPT },
    { name: "DICKY YUSUP WAHYUDI", uniqCode: 13, role: Role.OPT },
    { name: "DADAN", uniqCode: 14, role: Role.OPT },
    { name: "SYARIF HIDAYAT", uniqCode: 15, role: Role.OPT },
    { name: "AJANG JUHANA", uniqCode: 16, role: Role.OPT },
    { name: "OPIK NURYADI", uniqCode: 17, role: Role.OPT },
    { name: "INDRA HAFIFUDIN", uniqCode: 18, role: Role.OPT },
    { name: "ALDI MUKHLIS ARIPIN", uniqCode: 19, role: Role.OPT },
    { name: "KIKI SANDI", uniqCode: 20, role: Role.OPT },
    { name: "DEDE KOSWARA", uniqCode: 21, role: Role.OPT },
    { name: "TAUFIK SOFI HAMDANI", uniqCode: 22, role: Role.OPT },
    { name: "GENTA KURNIA", uniqCode: 23, role: Role.OPT },
    { name: "KINDARNA", uniqCode: 24, role: Role.OPT },
    { name: "LUTFI HABIBU", uniqCode: 25, role: Role.OPT },
    { name: "SARNO", uniqCode: 26, role: Role.OPT },
    { name: "KHALID RAMADHAN RUHIYAT", uniqCode: 27, role: Role.OPT },
    { name: "ANDRIY SHEVA", uniqCode: 28, role: Role.OPT },
    { name: "ILHAM NURYANDI", uniqCode: 29, role: Role.OPT },
    { name: "Rangga Fahmi Apriansyah", uniqCode: 30, role: Role.OPT },
    { name: "M. RIZKY AMMAR", uniqCode: 31, role: Role.OPT },
    { name: "FAUZAN PRATAMA", uniqCode: 241350017, role: Role.QC},
    { name: "ADMIN", uniqCode: 123, role: Role.ADMIN },

  ];

 for (const user of usersData) {
  await prisma.user.create({
    data: {
      name: user.name,
      uniqCode: user.uniqCode,
      role: user.role,
      password: `${user.role.toLowerCase()}${user.uniqCode}123`,
    },
  });
  console.log(`✅ Inserted: ${user.name} (${user.role})`);
}

console.log("✅ Seed selesai");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
