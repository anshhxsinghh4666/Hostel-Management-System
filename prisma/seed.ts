import { PrismaClient, Role, HostelType, RoomStatus, RoomType, StudentStatus, AllocationStatus, ComplaintCategory, ComplaintPriority, ComplaintStatus, LeaveStatus, PaymentMethod, PaymentStatus, VisitorRequestStatus, GatePassStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

const userSeeds = [
  { fullName: "System Administrator", email: "admin@hostelms.com", phone: "+1-555-000-0001", password: "Admin@123", role: Role.SUPER_ADMIN },
  { fullName: "Alice Johnson", email: "alice@hostelms.com", phone: "+1-555-000-0002", password: "Admin@123", role: Role.HOSTEL_ADMIN },
  { fullName: "Bob Williams", email: "bob@hostelms.com", phone: "+1-555-000-0003", password: "Admin@123", role: Role.HOSTEL_ADMIN },
  { fullName: "Charlie Brown", email: "charlie@hostelms.com", phone: "+1-555-000-0004", password: "Staff@123", role: Role.STAFF },
  { fullName: "Diana Prince", email: "diana@hostelms.com", phone: "+1-555-000-0005", password: "Staff@123", role: Role.STAFF },
  { fullName: "Eve Davis", email: "eve@hostelms.com", phone: "+1-555-000-0006", password: "Staff@123", role: Role.STAFF },
];

const hostelSeeds = [
  {
    hostelName: "Mahatma Gandhi Hostel", hostelType: HostelType.BOYS, totalRooms: 32, totalCapacity: 96,
    rooms: [
      { roomNumber: "101", floorNumber: 1, capacity: 3, roomType: RoomType.TRIPLE },
      { roomNumber: "102", floorNumber: 1, capacity: 3, roomType: RoomType.TRIPLE },
      { roomNumber: "103", floorNumber: 1, capacity: 3, roomType: RoomType.TRIPLE },
      { roomNumber: "104", floorNumber: 1, capacity: 3, roomType: RoomType.TRIPLE },
      { roomNumber: "105", floorNumber: 1, capacity: 3, roomType: RoomType.TRIPLE },
      { roomNumber: "106", floorNumber: 1, capacity: 2, roomType: RoomType.DOUBLE },
      { roomNumber: "107", floorNumber: 1, capacity: 2, roomType: RoomType.DOUBLE },
      { roomNumber: "108", floorNumber: 1, capacity: 1, roomType: RoomType.SINGLE },
      { roomNumber: "201", floorNumber: 2, capacity: 3, roomType: RoomType.TRIPLE },
      { roomNumber: "202", floorNumber: 2, capacity: 3, roomType: RoomType.TRIPLE },
      { roomNumber: "203", floorNumber: 2, capacity: 3, roomType: RoomType.TRIPLE },
      { roomNumber: "204", floorNumber: 2, capacity: 3, roomType: RoomType.TRIPLE },
      { roomNumber: "205", floorNumber: 2, capacity: 3, roomType: RoomType.TRIPLE },
      { roomNumber: "206", floorNumber: 2, capacity: 2, roomType: RoomType.DOUBLE },
      { roomNumber: "207", floorNumber: 2, capacity: 2, roomType: RoomType.DOUBLE },
      { roomNumber: "208", floorNumber: 2, capacity: 1, roomType: RoomType.SINGLE },
      { roomNumber: "301", floorNumber: 3, capacity: 4, roomType: RoomType.DORMITORY },
      { roomNumber: "302", floorNumber: 3, capacity: 4, roomType: RoomType.DORMITORY },
      { roomNumber: "303", floorNumber: 3, capacity: 4, roomType: RoomType.DORMITORY },
      { roomNumber: "304", floorNumber: 3, capacity: 4, roomType: RoomType.DORMITORY },
      { roomNumber: "305", floorNumber: 3, capacity: 4, roomType: RoomType.DORMITORY },
      { roomNumber: "306", floorNumber: 3, capacity: 2, roomType: RoomType.DOUBLE },
      { roomNumber: "307", floorNumber: 3, capacity: 2, roomType: RoomType.DOUBLE },
      { roomNumber: "308", floorNumber: 3, capacity: 1, roomType: RoomType.SINGLE },
      { roomNumber: "401", floorNumber: 4, capacity: 4, roomType: RoomType.DORMITORY },
      { roomNumber: "402", floorNumber: 4, capacity: 4, roomType: RoomType.DORMITORY },
      { roomNumber: "403", floorNumber: 4, capacity: 4, roomType: RoomType.DORMITORY },
      { roomNumber: "404", floorNumber: 4, capacity: 2, roomType: RoomType.DOUBLE },
      { roomNumber: "405", floorNumber: 4, capacity: 2, roomType: RoomType.DOUBLE },
      { roomNumber: "406", floorNumber: 4, capacity: 1, roomType: RoomType.SINGLE },
      { roomNumber: "407", floorNumber: 4, capacity: 1, roomType: RoomType.SINGLE },
      { roomNumber: "408", floorNumber: 4, capacity: 1, roomType: RoomType.SINGLE },
    ],
  },
  {
    hostelName: "Sarojini Naidu Hostel", hostelType: HostelType.GIRLS, totalRooms: 28, totalCapacity: 84,
    rooms: [
      { roomNumber: "A-101", floorNumber: 1, capacity: 3, roomType: RoomType.TRIPLE },
      { roomNumber: "A-102", floorNumber: 1, capacity: 3, roomType: RoomType.TRIPLE },
      { roomNumber: "A-103", floorNumber: 1, capacity: 3, roomType: RoomType.TRIPLE },
      { roomNumber: "A-104", floorNumber: 1, capacity: 3, roomType: RoomType.TRIPLE },
      { roomNumber: "A-105", floorNumber: 1, capacity: 2, roomType: RoomType.DOUBLE },
      { roomNumber: "A-106", floorNumber: 1, capacity: 2, roomType: RoomType.DOUBLE },
      { roomNumber: "A-107", floorNumber: 1, capacity: 1, roomType: RoomType.SINGLE },
      { roomNumber: "A-201", floorNumber: 2, capacity: 3, roomType: RoomType.TRIPLE },
      { roomNumber: "A-202", floorNumber: 2, capacity: 3, roomType: RoomType.TRIPLE },
      { roomNumber: "A-203", floorNumber: 2, capacity: 3, roomType: RoomType.TRIPLE },
      { roomNumber: "A-204", floorNumber: 2, capacity: 3, roomType: RoomType.TRIPLE },
      { roomNumber: "A-205", floorNumber: 2, capacity: 2, roomType: RoomType.DOUBLE },
      { roomNumber: "A-206", floorNumber: 2, capacity: 2, roomType: RoomType.DOUBLE },
      { roomNumber: "A-207", floorNumber: 2, capacity: 1, roomType: RoomType.SINGLE },
      { roomNumber: "A-301", floorNumber: 3, capacity: 4, roomType: RoomType.DORMITORY },
      { roomNumber: "A-302", floorNumber: 3, capacity: 4, roomType: RoomType.DORMITORY },
      { roomNumber: "A-303", floorNumber: 3, capacity: 4, roomType: RoomType.DORMITORY },
      { roomNumber: "A-304", floorNumber: 3, capacity: 4, roomType: RoomType.DORMITORY },
      { roomNumber: "A-305", floorNumber: 3, capacity: 2, roomType: RoomType.DOUBLE },
      { roomNumber: "A-306", floorNumber: 3, capacity: 2, roomType: RoomType.DOUBLE },
      { roomNumber: "A-307", floorNumber: 3, capacity: 1, roomType: RoomType.SINGLE },
      { roomNumber: "A-401", floorNumber: 4, capacity: 4, roomType: RoomType.DORMITORY },
      { roomNumber: "A-402", floorNumber: 4, capacity: 4, roomType: RoomType.DORMITORY },
      { roomNumber: "A-403", floorNumber: 4, capacity: 4, roomType: RoomType.DORMITORY },
      { roomNumber: "A-404", floorNumber: 4, capacity: 2, roomType: RoomType.DOUBLE },
      { roomNumber: "A-405", floorNumber: 4, capacity: 2, roomType: RoomType.DOUBLE },
      { roomNumber: "A-406", floorNumber: 4, capacity: 1, roomType: RoomType.SINGLE },
      { roomNumber: "A-407", floorNumber: 4, capacity: 1, roomType: RoomType.SINGLE },
    ],
  },
];

const firstNamesMale = [
  "Frank","Henry","Jack","Kevin","Mike","Oliver","Quinn","Sam","Victor","Xavier","Zane","Blake","Dylan","Felix","Hugo","Jasper","Kai","Miles","Oscar","Rafael","Theo","Winston","Yusuf","Arjun","Carlos","Erik","Liam","Noah","Ethan","Mason","Logan","Lucas","James","Benjamin","Daniel","Aiden","Elijah","Ryan","David","John","Luke","Nathan","Aaron","Adam","Tyler","Brandon","Sean","Kyle","Derek","Scott",
];
const firstNamesFemale = [
  "Grace","Ivy","Lisa","Nina","Priya","Riya","Tara","Uma","Wendy","Yara","Aria","Chloe","Elena","Gia","Isla","Luna","Nora","Penelope","Suki","Valentina","Xiu","Zara","Bella","Dahlia","Sophia","Emma","Olivia","Ava","Mia","Charlotte","Amelia","Harper","Ella","Scarlett","Grace","Chloe","Victoria","Riley","Aurora","Savannah","Brooklyn","Hannah","Layla","Zoe","Stella","Hazel","Aurora","Eleanor","Paisley","Maya",
];
const lastNames = [
  "Miller","Lee","Wilson","Thomas","Anderson","Patel","Wang","Johnson","Sharma","Brown","Singh","Davis","Verma","Taylor","Gupta","Krishnan","Chen","Zhang","Martinez","Ali","Khan","Kim","Das","O'Brien","Costa","Garcia","Lopez","Silva","Fischer","Nguyen","Nakamura","Moreno","Torres","Petrov","Olsen","Park","Santos","Yamamoto","Andersen","Rossi","Okafor","Reddy","Cohen","Mendez","Smith","Johansson","Thompson","White","Harris","Clark",
];
const courses = [
  "Computer Science","Electrical Engineering","Mechanical Engineering","Business Administration","Information Technology","Civil Engineering","Biotechnology","Electronics & Communication","Data Science","Artificial Intelligence","Cyber Security","Chemical Engineering","Aerospace Engineering","Mathematics","Physics",
];
const complaintSubjects = [
  "Leaking Faucet in Washroom","Power Outage in Room","WiFi Not Working","Broken Chair","Common Area Cleaning","Fan Not Working","Toilet Blockage","Slow Internet Speed","Broken Bed Slats","Bathroom Hygiene","Light Flickering","Water Heater Not Working","Noise Complaint","WiFi Router Down","Dustbin Not Emptied","AC Not Cooling","Tap Dripping","Study Table Damaged","Ethernet Port Not Working","Mosquito Infestation","Window Glass Broken","Door Lock Malfunction","Pest Control Needed","Water Seepage in Wall","Elevator Not Working","Parking Issue","Canteen Food Quality","Laundry Machine Broken","Common Room TV Not Working","Emergency Light Not Working",
];
const complaintDescs = [
  "The faucet has been leaking for 2 days. Water accumulating on the floor.",
  "Room has no power since morning. All switches are down.",
  "WiFi connectivity is very poor. Unable to attend online classes.",
  "The study chair is broken. Need replacement urgently.",
  "Corridor has not been cleaned for a week. Trash is piling up.",
  "Ceiling fan is not working. Very hot and uncomfortable.",
  "Toilet is blocked. Needs immediate attention.",
  "Internet speed has been very slow in the evenings.",
  "Bed slats are broken. Need repair or replacement.",
  "Bathroom needs deep cleaning. Mold growing in corners.",
  "Tube light flickers constantly. Causes headaches.",
  "No hot water available. Water heater seems broken.",
  "Loud music after midnight. Unable to sleep.",
  "WiFi router on floor 2 has been down since yesterday.",
  "Dustbins not emptied for 3 days.",
  "Air conditioner not cooling properly.",
  "Washbasin tap constantly dripping. Wasting water.",
  "Study table has a broken leg, tilts when writing.",
  "LAN port in room is dead. Need connectivity fix.",
  "Many mosquitoes in corridor due to stagnant water.",
  "Window glass cracked after storm. Needs replacement.",
  "Door lock is jammed. Cannot close properly.",
  "Cockroach infestation in the kitchen area.",
  "Water seeping through wall during rain.",
  "Elevator stuck between floors. Safety hazard.",
  "Insufficient parking space for visitors.",
  "Poor quality food served in canteen.",
  "Washing machine not spinning properly.",
  "Common room TV has no audio output.",
  "Emergency exit light not working on floor 3.",
];
const leaveReasons = [
  "Family wedding","Medical appointment","Going home for holidays","Sister's graduation","Personal reasons","Grandmother's birthday","Dental appointment","Religious festival","Family emergency","Career fair","Friend's wedding","Health checkup","Semester break","Examination leave","Sports event","Internship interview","Workshop attendance","Community service",
];
const visitorNames = [
  "George Miller","Hannah Lee","Irene Wilson","Jack Thomas","Lisa Anderson","Raj Patel","Ming Wang","Nancy Johnson","Arun Sharma","Patricia Brown","Raj Singh","Tina Taylor","Vishal Krishnan","Yolanda Martinez","Aisha Khan","Deepak Patel","Fiona O'Brien","Marco Costa","Isabella Silva","Minh Nguyen","Sofia Torres","Jin Park","Hiro Yamamoto","May Lee","Amina Okafor","David Cohen","Edward Smith","Mei Chen","Rajesh Gupta","Priya Sharma","Ahmed Hassan","Olga Petrov","Carlos Mendez","Sarah Mitchell","James Wilson","Emily Davis","Michael Brown","Jessica Taylor","Robert Johnson","Amanda White",
];
const visitorRelations = [
  "Father","Mother","Brother","Sister","Uncle","Aunt","Grandfather","Grandmother","Cousin","Guardian",
];

interface StudentSeed {
  registrationNumber: string; firstName: string; lastName: string; gender: string;
  email: string; phone: string; course: string; year: number;
  guardianName: string; guardianPhone: string; address: string;
}

function generateStudents(count: number): StudentSeed[] {
  const students: StudentSeed[] = [];
  const usedRegNos = new Set<string>();
  for (let i = 0; i < count; i++) {
    const idx = i + 1;
    const regNo = `STU-2024-${String(idx).padStart(3, "0")}`;
    if (usedRegNos.has(regNo)) continue;
    usedRegNos.add(regNo);
    const isMale = Math.random() > 0.45;
    const firstNames = isMale ? firstNamesMale : firstNamesFemale;
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${idx}@student.com`;
    const phone = `+1-555-100-${String(idx + 50).padStart(4, "0")}`;
    const course = courses[i % courses.length];
    const year = (i % 4) + 1;
    const guardianName = `${lastNames[(i + 13) % lastNames.length]} ${lastName}`;
    const guardianPhone = `+1-555-200-${String(idx + 50).padStart(4, "0")}`;
    const address = `${100 + i} ${["Main St","Oak Ave","Pine Rd","Elm St","Birch Ln","Cedar Dr","Maple Ave","Walnut St","Ash Blvd","Spruce Way","Willow Ct","Poplar Ave","Cherry Ln","Hickory Dr","Ashram Rd","Temple St","Garden Ave","Lake Dr","Ocean Blvd","Desert Way","Mountain Rd","Valley Dr","Forest Ln","River Rd","Hill St","Beach Rd","Sunset Blvd","Harbor Dr","Lakeview Ave","Park Ave","Cherry Blossom Ln","Star Ave","Mountain Pass","Volga St","Fjord Rd","Seoul St","Copacabana Ave","Fuji St","Viking Way","Roma Ave","Dragon St","Silk Rd","Savannah Ave","Highlands Rd","Tech Park","Zion St","Maya Rd","Queen St","Viking St","Garden Rd"][i % 50]}, ${["Springfield","Rivertown","Lakewood","Hilltop","Westside","Eastville","Northtown","Southpark","Westend","Lakeside","Eastwood","Hillcrest","Brookside","Meadowvale","Greenfield","Riverbend","Parkview","Sunset","Coastview","Oasis","Highland","Lowlands","Woodlands","Brookfield","Uptown","Seaview","Pacifica","Marina","Clearwater","Greendale","Sakura","Galaxy","Moscow","Oslo","Gangnam","Rio","Tokyo","Copenhagen","Rome","Shanghai","Beijing","Lagos","Addis","Hyderabad","Jerusalem","Mexico City","London","Stockholm","Berlin","Dublin"][i % 50]}`;
    students.push({ registrationNumber: regNo, firstName, lastName, gender: isMale ? "male" : "female", email, phone, course, year, guardianName, guardianPhone, address });
  }
  return students;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() - months);
  return result;
}

function generatePassNumber(): string {
  const prefix = "GP";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

function generateQrToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("Seeding database...\n");

  for (const userData of userSeeds) {
    const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        fullName: userData.fullName, email: userData.email, phone: userData.phone,
        passwordHash, role: userData.role,
      },
    });
  }
  console.log(`✓ Created ${userSeeds.length} users`);

  const createdHostelIds: string[] = [];
  for (const hostelData of hostelSeeds) {
    const existing = await prisma.hostel.findUnique({
      where: { hostelName_hostelType: { hostelName: hostelData.hostelName, hostelType: hostelData.hostelType } },
    });
    if (existing) {
      createdHostelIds.push(existing.id);
      continue;
    }
    const hostel = await prisma.hostel.create({
      data: { hostelName: hostelData.hostelName, hostelType: hostelData.hostelType, totalRooms: hostelData.totalRooms, totalCapacity: hostelData.totalCapacity },
    });
    createdHostelIds.push(hostel.id);
    for (const roomData of hostelData.rooms) {
      await prisma.room.create({
        data: { hostelId: hostel.id, roomNumber: roomData.roomNumber, floorNumber: roomData.floorNumber, capacity: roomData.capacity, roomType: roomData.roomType },
      });
    }
    console.log(`✓ Created hostel: ${hostel.hostelName} (${hostelData.rooms.length} rooms)`);
  }

  const mgh = await prisma.hostel.findUnique({ where: { hostelName_hostelType: { hostelName: "Mahatma Gandhi Hostel", hostelType: HostelType.BOYS } } });
  const snh = await prisma.hostel.findUnique({ where: { hostelName_hostelType: { hostelName: "Sarojini Naidu Hostel", hostelType: HostelType.GIRLS } } });

  const allRooms = await prisma.room.findMany({ orderBy: { roomNumber: "asc" } });
  const boysRooms = allRooms.filter(r => r.hostelId === mgh?.id);
  const girlsRooms = allRooms.filter(r => r.hostelId === snh?.id);

  const createdStudentIds: string[] = [];

  const studentSeeds = generateStudents(100);

  for (const studentData of studentSeeds) {
    const existing = await prisma.student.findUnique({ where: { registrationNumber: studentData.registrationNumber } });
    if (existing) {
      createdStudentIds.push(existing.id);
      continue;
    }

    const isMale = studentData.gender === "male";
    const hostel = isMale ? mgh : snh;
    const rooms = isMale ? boysRooms : girlsRooms;
    const availableRooms = rooms.filter(r => r.occupiedBeds < r.capacity);
    const room = availableRooms.length > 0 ? availableRooms[Math.floor(Math.random() * availableRooms.length)] : null;

    const student = await prisma.student.create({
      data: {
        registrationNumber: studentData.registrationNumber, firstName: studentData.firstName,
        lastName: studentData.lastName, gender: studentData.gender, email: studentData.email,
        phone: studentData.phone, course: studentData.course, year: studentData.year,
        guardianName: studentData.guardianName, guardianPhone: studentData.guardianPhone,
        address: studentData.address, status: StudentStatus.ACTIVE,
        ...(room ? { hostelId: hostel?.id, roomId: room.id, checkInDate: new Date() } : {}),
      },
    });
    createdStudentIds.push(student.id);

    if (room && hostel) {
      await prisma.room.update({
        where: { id: room.id },
        data: { occupiedBeds: { increment: 1 }, roomStatus: room.occupiedBeds + 1 >= room.capacity ? RoomStatus.FULL : RoomStatus.AVAILABLE },
      });
      await prisma.hostel.update({ where: { id: hostel.id }, data: { occupiedCapacity: { increment: 1 } } });
      await prisma.roomAllocation.create({
        data: { studentId: student.id, roomId: room.id, allocatedDate: new Date(), allocationStatus: AllocationStatus.ACTIVE },
      });
    }
  }
  console.log(`✓ Created/verified ${createdStudentIds.length} students`);

  const complaintCategories = Object.values(ComplaintCategory);
  const complaintPriorities = Object.values(ComplaintPriority);
  const complaintStatuses = Object.values(ComplaintStatus);
  const paymentMethods = Object.values(PaymentMethod);
  const paymentStatuses = Object.values(PaymentStatus);
  const leaveStatuses = Object.values(LeaveStatus);
  const visitorStatuses = Object.values(VisitorRequestStatus);

  console.log("\n--- Creating complaints...");
  let complaintCount = 0;
  for (let i = 0; i < 60; i++) {
    const studentId = createdStudentIds[i % createdStudentIds.length];
    if (!studentId) continue;
    const cat = pickRandom(complaintCategories);
    const pri = pickRandom(complaintPriorities);
    const sta = pickRandom(complaintStatuses);
    const sub = complaintSubjects[i % complaintSubjects.length];
    const desc = complaintDescs[i % complaintDescs.length];
    const createdAt = addMonths(new Date(), Math.floor(Math.random() * 6));
    const updatedAt = sta !== ComplaintStatus.PENDING
      ? new Date(createdAt.getTime() + 86400000 * (Math.floor(Math.random() * 5 + 1)))
      : createdAt;

    await prisma.complaint.create({
      data: {
        studentId, category: cat, subject: sub, description: desc,
        priority: pri, status: sta,
        adminRemark: sta === ComplaintStatus.RESOLVED ? "Issue has been resolved." : sta === ComplaintStatus.IN_PROGRESS ? "We are working on it." : null,
        createdAt, updatedAt,
      },
    });
    complaintCount++;
  }
  console.log(`✓ Created ${complaintCount} complaints`);

  console.log("\n--- Creating payments...");
  let paymentCount = 0;
  const amounts = [6500, 7500, 8000, 8500, 9000];
  for (let i = 0; i < 120; i++) {
    const studentId = createdStudentIds[i % createdStudentIds.length];
    if (!studentId) continue;
    const paymentDate = addMonths(new Date(), Math.floor(Math.random() * 12));
    const pm = pickRandom(paymentMethods);
    const ps = pickRandom(paymentStatuses);
    const txn = ps === PaymentStatus.COMPLETED ? `TXN${String(paymentCount + 1).padStart(8, "0")}` : null;
    await prisma.payment.create({
      data: {
        studentId, amount: pickRandom(amounts), paymentMethod: pm, status: ps,
        transactionId: txn,
        remarks: ps === PaymentStatus.COMPLETED ? "Payment received successfully"
          : ps === PaymentStatus.PENDING ? "Awaiting payment"
          : ps === PaymentStatus.FAILED ? "Transaction failed"
          : ps === PaymentStatus.REFUNDED ? "Amount refunded" : null,
        paymentDate,
      },
    });
    paymentCount++;
  }
  console.log(`✓ Created ${paymentCount} payment records`);

  console.log("\n--- Creating leave requests...");
  let leaveCount = 0;
  for (let i = 0; i < 30; i++) {
    const studentId = createdStudentIds[i % createdStudentIds.length];
    if (!studentId) continue;
    const fromDate = addMonths(new Date(), Math.floor(Math.random() * 3 + 1));
    const toDate = new Date(fromDate.getTime() + 86400000 * (Math.floor(Math.random() * 5 + 2)));
    const reason = leaveReasons[i % leaveReasons.length];
    const ls = pickRandom(leaveStatuses);
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    const parentName = student?.guardianName || "Guardian";
    const emergencyContact = student?.guardianPhone || "+1-555-300-0001";

    await prisma.leaveRequest.create({
      data: {
        studentId, fromDate, toDate, reason,
        emergencyContact, parentName,
        status: ls,
        adminComment: ls === LeaveStatus.APPROVED ? "Approved. Take care!" : ls === LeaveStatus.REJECTED ? "Please provide more documentation." : null,
        createdAt: addMonths(fromDate, 1),
      },
    });
    leaveCount++;
  }
  console.log(`✓ Created ${leaveCount} leave requests`);

  console.log("\n--- Creating visitors and visitor requests...");
  let visitorCount = 0;
  let gatePassCount = 0;
  for (let i = 0; i < 45; i++) {
    const studentId = createdStudentIds[i % createdStudentIds.length];
    if (!studentId) continue;

    const visitorName = visitorNames[i % visitorNames.length];
    const relation = pickRandom(visitorRelations);
    const mobile = `+1-555-400-${String(i + 30).padStart(3, "0")}`;

    const visitor = await prisma.visitor.create({
      data: { name: visitorName, mobile, relation },
    });

    const visitDate = addMonths(new Date(), Math.floor(Math.random() * 2));
    visitDate.setDate(Math.min(visitDate.getDate() + (i % 30), 28));

    const arrivalTime = `${8 + Math.floor(Math.random() * 10)}:${Math.random() > 0.5 ? "00" : "30"}`;
    const depTime = `${10 + Math.floor(Math.random() * 8)}:${Math.random() > 0.5 ? "00" : "30"}`;
    const vs = pickRandom(visitorStatuses);

    const request = await prisma.visitorRequest.create({
      data: {
        studentId, visitorId: visitor.id,
        purpose: `Visitor for ${relation}`,
        visitDate, arrivalTime, departureTime: depTime,
        status: vs, createdAt: addMonths(visitDate, 0),
      },
    });

    if (vs === VisitorRequestStatus.APPROVED) {
      const qrToken = generateQrToken();
      const passNumber = generatePassNumber();
      const [arrH, arrM] = arrivalTime.split(":").map(Number);
      const [depH, depM] = depTime.split(":").map(Number);
      const validFrom = new Date(visitDate); validFrom.setHours(arrH, arrM, 0, 0);
      const validTo = new Date(visitDate); validTo.setHours(depH, depM, 0, 0);

      const gatePass = await prisma.gatePass.create({
        data: { requestId: request.id, passNumber, qrToken, validFrom, validTo },
      });
      gatePassCount++;

      if (i % 4 === 0) {
        const checkIn = new Date(validFrom);
        checkIn.setMinutes(checkIn.getMinutes() + Math.floor(Math.random() * 30));
        const checkOut = new Date(validTo);
        checkOut.setMinutes(checkOut.getMinutes() - Math.floor(Math.random() * 60));
        await prisma.visitorLog.create({
          data: { gatePassId: gatePass.id, checkInTime: checkIn, checkOutTime: checkOut },
        });
      }
    }
    visitorCount++;
  }
  console.log(`✓ Created ${visitorCount} visitor requests with ${gatePassCount} gate passes`);

  console.log("\n--- Creating notifications...");
  let notificationCount = 0;
  const totalUsers = await prisma.user.findMany();
  for (const user of totalUsers) {
    if (Math.random() > 0.3) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Welcome to Hostel Management System",
          message: `Welcome ${user.fullName}! Your account has been created with ${user.role} role.`,
          createdAt: addMonths(new Date(), 2),
        },
      });
      notificationCount++;
    }
    if (Math.random() > 0.5) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Monthly Fee Reminder",
          message: "Your monthly hostel fee is due. Please pay before the 10th.",
          createdAt: addMonths(new Date(), 1),
        },
      });
      notificationCount++;
    }
  }

  for (let i = 0; i < createdStudentIds.length; i++) {
    const student = await prisma.student.findUnique({ where: { id: createdStudentIds[i] } });
    if (!student?.email) continue;
    const user = await prisma.user.findFirst({ where: { email: student.email } });
    if (!user) continue;
    if (Math.random() > 0.6) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Complaint Registered",
          message: "Your complaint has been registered and will be addressed soon.",
          createdAt: addMonths(new Date(), Math.floor(Math.random() * 3)),
        },
      });
      notificationCount++;
    }
  }
  console.log(`✓ Created ${notificationCount} notifications`);

  const totalUsersCount = await prisma.user.count();
  const totalStudents = await prisma.student.count();
  const totalRooms = await prisma.room.count();
  const totalPayments = await prisma.payment.count();
  const totalComplaints = await prisma.complaint.count();
  const totalLeaves = await prisma.leaveRequest.count();
  const totalVisitors = await prisma.visitor.count();
  const totalGatePasses = await prisma.gatePass.count();
  const totalNotifications = await prisma.notification.count();
  const totalAllocations = await prisma.roomAllocation.count();
  const totalVisitorRequests = await prisma.visitorRequest.count();
  const totalVisitorLogs = await prisma.visitorLog.count();

  console.log(`\n=== Seed Summary ===`);
  console.log(`Users: ${totalUsersCount}`);
  console.log(`Students: ${totalStudents}`);
  console.log(`Rooms: ${totalRooms}`);
  console.log(`Room Allocations: ${totalAllocations}`);
  console.log(`Complaints: ${totalComplaints}`);
  console.log(`Payments: ${totalPayments}`);
  console.log(`Leave Requests: ${totalLeaves}`);
  console.log(`Visitors: ${totalVisitors}`);
  console.log(`Visitor Requests: ${totalVisitorRequests}`);
  console.log(`Gate Passes: ${totalGatePasses}`);
  console.log(`Visitor Logs: ${totalVisitorLogs}`);
  console.log(`Notifications: ${totalNotifications}`);
  const grandTotal = totalUsersCount + totalStudents + totalRooms + totalAllocations + totalComplaints + totalPayments + totalLeaves + totalVisitors + totalVisitorRequests + totalGatePasses + totalVisitorLogs + totalNotifications;
  console.log(`\nGrand total entries: ${grandTotal}`);
  const oldTotal = 338;
  const newEntries = grandTotal - oldTotal;
  console.log(`New entries added vs original seed (approx): ${newEntries}`);
  console.log("\nDefault Credentials:");
  console.log("  Admin: admin@hostelms.com / Admin@123");
  console.log("  Hostel Admin: alice@hostelms.com / Admin@123");
  console.log("  Staff: charlie@hostelms.com / Staff@123");
  console.log("\n✓ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
