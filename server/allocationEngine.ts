import {
  Student,
  Room,
  ExamSchedule,
  AllocatedSeat,
  UnallocatedStudent,
  AllocationQualityReport,
  SeatingAllocation,
  ExamShift,
} from './types';

export interface AllocationInput {
  schedules: ExamSchedule[];
  students: Student[];
  rooms: Room[];
  examDate: string;
  shift: ExamShift;
  strictAdjacency?: boolean;
  enableInterleaving?: boolean;
}

interface CandidateSeat {
  roomId: string;
  roomNumber: string;
  building: string;
  floor: number;
  rowNumber: number;
  colNumber: number;
  seatLabel: string;
  isAccessible: boolean;
  orderKey: number;
}

export function runAllocationEngine(input: AllocationInput): SeatingAllocation {
  const {
    schedules,
    students,
    rooms,
    examDate,
    shift,
    enableInterleaving = true,
  } = input;

  // 1. Filter eligible students enrolled in the scheduled subjects
  const scheduleSubjectMap = new Map<string, ExamSchedule>();
  schedules.forEach((sch) => {
    scheduleSubjectMap.set(sch.subjectCode, sch);
  });

  const subjectStudentsMap = new Map<string, Student[]>();
  schedules.forEach((sch) => {
    subjectStudentsMap.set(sch.subjectCode, []);
  });

  const unallocatedStudents: UnallocatedStudent[] = [];

  students.forEach((student) => {
    // Check which scheduled subject the student is taking
    const enrolledScheduled = student.subjectCodes.find((sc) =>
      scheduleSubjectMap.has(sc)
    );

    if (!enrolledScheduled) return;

    if (!student.isEligible) {
      unallocatedStudents.push({
        studentId: student.id,
        rollNumber: student.rollNumber,
        studentName: student.name,
        subjectCode: enrolledScheduled,
        departmentCode: student.departmentId.replace('dept_', '').toUpperCase(),
        reason: student.eligibilityReason || 'Student marked ineligible by Academic Registrar',
      });
      return;
    }

    const list = subjectStudentsMap.get(enrolledScheduled);
    if (list) {
      list.push(student);
    }
  });

  // Calculate total eligible students
  let totalEligibleCount = 0;
  subjectStudentsMap.forEach((list) => {
    totalEligibleCount += list.length;
  });

  // 2. Filter available rooms and build usable candidate seats
  const activeRooms = rooms
    .filter((r) => r.isAvailable)
    .sort((a, b) => {
      // Prioritize ground floor rooms first for accessibility
      if (a.floor !== b.floor) return a.floor - b.floor;
      return b.availableSeats - a.availableSeats;
    });

  const totalUsableSeatsInRooms = activeRooms.reduce(
    (sum, r) => sum + r.availableSeats,
    0
  );

  const notes: string[] = [];

  if (totalUsableSeatsInRooms < totalEligibleCount) {
    notes.push(
      `Warning: Total room capacity (${totalUsableSeatsInRooms}) is less than eligible students (${totalEligibleCount}). Deficit: ${totalEligibleCount - totalUsableSeatsInRooms} seats.`
    );
  }

  // Build grid of seats per room
  interface RoomGrid {
    room: Room;
    seats: CandidateSeat[];
  }

  const roomGrids: RoomGrid[] = [];

  activeRooms.forEach((room) => {
    const seats: CandidateSeat[] = [];
    const blocked = new Set(room.layoutConfig.blockedSeats || []);
    const isAccessible = room.floor === 0 || room.accessibilityInfo.toLowerCase().includes('accessible');

    for (let r = 1; r <= room.totalRows; r++) {
      for (let c = 1; c <= room.totalColumns; c++) {
        const code = `R${r}C${c}`;
        if (!blocked.has(code)) {
          seats.push({
            roomId: room.id,
            roomNumber: room.roomNumber,
            building: room.building,
            floor: room.floor,
            rowNumber: r,
            colNumber: c,
            seatLabel: `R${r}-${String(c).padStart(2, '0')}`,
            isAccessible,
            orderKey: r * 100 + c,
          });
        }
      }
    }

    // Sort seats in serpentine / classroom row-by-row order
    seats.sort((a, b) => a.orderKey - b.orderKey);

    roomGrids.push({
      room,
      seats,
    });
  });

  // 3. Separate special-needs students and normal students
  const specialNeedsStudents: { student: Student; subjectCode: string }[] = [];
  const regularSubjectQueues: Map<string, Student[]> = new Map();

  subjectStudentsMap.forEach((stuList, subjectCode) => {
    const regList: Student[] = [];
    stuList.forEach((stu) => {
      if (stu.specialNeeds) {
        specialNeedsStudents.push({ student: stu, subjectCode });
      } else {
        regList.push(stu);
      }
    });
    // Shuffle slightly or sort by roll number for predictability
    regList.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));
    regularSubjectQueues.set(subjectCode, regList);
  });

  const allocatedSeats: AllocatedSeat[] = [];
  const assignedSeatKeys = new Set<string>(); // roomId + '-' + row + '-' + col

  // 4. Place special-needs students in Ground Floor / Accessible rooms first (front rows)
  specialNeedsStudents.forEach(({ student, subjectCode }) => {
    const sch = scheduleSubjectMap.get(subjectCode)!;
    // Find first accessible seat
    let placed = false;
    for (const grid of roomGrids) {
      if (!grid.room.isAvailable) continue;
      const seat = grid.seats.find((s) => {
        const key = `${s.roomId}-${s.rowNumber}-${s.colNumber}`;
        return !assignedSeatKeys.has(key) && s.isAccessible && s.rowNumber <= 2;
      });

      if (seat) {
        const key = `${seat.roomId}-${seat.rowNumber}-${seat.colNumber}`;
        assignedSeatKeys.add(key);
        allocatedSeats.push({
          seatId: `${seat.roomId}-${seat.seatLabel}`,
          roomId: seat.roomId,
          roomNumber: seat.roomNumber,
          building: seat.building,
          floor: seat.floor,
          rowNumber: seat.rowNumber,
          colNumber: seat.colNumber,
          seatLabel: seat.seatLabel,
          studentId: student.id,
          regNumber: student.regNumber,
          rollNumber: student.rollNumber,
          studentName: student.name,
          subjectCode,
          subjectName: sch.subjectName,
          departmentCode: student.departmentId.replace('dept_', '').toUpperCase(),
          attendanceStatus: 'not_marked',
          remarks: 'Special Mobility / Ground Floor Placement',
        });
        placed = true;
        break;
      }
    }

    if (!placed) {
      // If no front-row accessible seat, try any seat in floor 0
      for (const grid of roomGrids) {
        const seat = grid.seats.find((s) => {
          const key = `${s.roomId}-${s.rowNumber}-${s.colNumber}`;
          return !assignedSeatKeys.has(key) && grid.room.floor === 0;
        });

        if (seat) {
          const key = `${seat.roomId}-${seat.rowNumber}-${seat.colNumber}`;
          assignedSeatKeys.add(key);
          allocatedSeats.push({
            seatId: `${seat.roomId}-${seat.seatLabel}`,
            roomId: seat.roomId,
            roomNumber: seat.roomNumber,
            building: seat.building,
            floor: seat.floor,
            rowNumber: seat.rowNumber,
            colNumber: seat.colNumber,
            seatLabel: seat.seatLabel,
            studentId: student.id,
            regNumber: student.regNumber,
            rollNumber: student.rollNumber,
            studentName: student.name,
            subjectCode,
            subjectName: sch.subjectName,
            departmentCode: student.departmentId.replace('dept_', '').toUpperCase(),
            attendanceStatus: 'not_marked',
            remarks: 'Ground Floor Placement',
          });
          placed = true;
          break;
        }
      }
    }

    if (!placed) {
      unallocatedStudents.push({
        studentId: student.id,
        rollNumber: student.rollNumber,
        studentName: student.name,
        subjectCode,
        departmentCode: student.departmentId.replace('dept_', '').toUpperCase(),
        reason: 'No accessible ground floor seating available for special accommodation',
      });
    }
  });

  // 5. Intelligent Multi-Subject Interleaving Across Rooms
  // Order subjects by remaining count
  const subjectCodes = Array.from(regularSubjectQueues.keys());

  // Room by room filling with anti-malpractice interleaving
  for (const grid of roomGrids) {
    const availableSeatsInRoom = grid.seats.filter((s) => {
      const key = `${s.roomId}-${s.rowNumber}-${s.colNumber}`;
      return !assignedSeatKeys.has(key);
    });

    if (availableSeatsInRoom.length === 0) continue;

    // Determine which subjects to place in this room
    // For optimal anti-cheat, we interleave multiple active subjects if enableInterleaving is true
    for (const seat of availableSeatsInRoom) {
      const key = `${seat.roomId}-${seat.rowNumber}-${seat.colNumber}`;
      if (assignedSeatKeys.has(key)) continue;

      // Find best subject for this seat (row, col)
      // Check horizontal left neighbor (col - 1) and vertical top neighbor (row - 1)
      const leftNeighbor = allocatedSeats.find(
        (as) => as.roomId === seat.roomId && as.rowNumber === seat.rowNumber && as.colNumber === seat.colNumber - 1
      );
      const topNeighbor = allocatedSeats.find(
        (as) => as.roomId === seat.roomId && as.rowNumber === seat.rowNumber - 1 && as.colNumber === seat.colNumber
      );
      const diagLeftTop = allocatedSeats.find(
        (as) => as.roomId === seat.roomId && as.rowNumber === seat.rowNumber - 1 && as.colNumber === seat.colNumber - 1
      );

      // Score each subject candidate
      let bestSubject: string | null = null;
      let lowestPenalty = Infinity;

      // In checkerboard interleaving, we alternate parity (row + col) % numSubjects
      const parityChoice = (seat.rowNumber + seat.colNumber) % subjectCodes.length;
      const preferredCode = subjectCodes[parityChoice];

      // Sort candidate subjects prioritizing ones with remaining students and non-matching neighbors
      const candidates = subjectCodes
        .filter((sc) => {
          const queue = regularSubjectQueues.get(sc);
          return queue && queue.length > 0;
        })
        .sort((a, b) => {
          const qA = regularSubjectQueues.get(a)!.length;
          const qB = regularSubjectQueues.get(b)!.length;
          return qB - qA; // larger queue first
        });

      if (candidates.length === 0) {
        // No more regular students left to allocate
        break;
      }

      for (const cand of candidates) {
        let penalty = 0;
        if (leftNeighbor && leftNeighbor.subjectCode === cand) {
          penalty += 100; // Strict anti-cheat: direct side-by-side same subject
        }
        if (topNeighbor && topNeighbor.subjectCode === cand) {
          penalty += 50; // Direct front-back same subject
        }
        if (diagLeftTop && diagLeftTop.subjectCode === cand) {
          penalty += 15; // Diagonal
        }
        if (enableInterleaving && cand === preferredCode) {
          penalty -= 10; // Bonus for adhering to interleaving parity
        }

        if (penalty < lowestPenalty) {
          lowestPenalty = penalty;
          bestSubject = cand;
        }
      }

      if (!bestSubject) {
        bestSubject = candidates[0];
      }

      const queue = regularSubjectQueues.get(bestSubject)!;
      const nextStudent = queue.shift();

      if (nextStudent) {
        const sch = scheduleSubjectMap.get(bestSubject)!;
        assignedSeatKeys.add(key);
        allocatedSeats.push({
          seatId: `${seat.roomId}-${seat.seatLabel}`,
          roomId: seat.roomId,
          roomNumber: seat.roomNumber,
          building: seat.building,
          floor: seat.floor,
          rowNumber: seat.rowNumber,
          colNumber: seat.colNumber,
          seatLabel: seat.seatLabel,
          studentId: nextStudent.id,
          regNumber: nextStudent.regNumber,
          rollNumber: nextStudent.rollNumber,
          studentName: nextStudent.name,
          subjectCode: bestSubject,
          subjectName: sch.subjectName,
          departmentCode: nextStudent.departmentId.replace('dept_', '').toUpperCase(),
          attendanceStatus: 'not_marked',
        });
      }
    }
  }

  // 6. Any students still in queues couldn't be placed due to capacity exhaustion
  regularSubjectQueues.forEach((queue, sc) => {
    queue.forEach((stu) => {
      unallocatedStudents.push({
        studentId: stu.id,
        rollNumber: stu.rollNumber,
        studentName: stu.name,
        subjectCode: sc,
        departmentCode: stu.departmentId.replace('dept_', '').toUpperCase(),
        reason: 'Examination hall seat capacity exhausted in all available rooms for this shift',
      });
    });
  });

  // 7. Comprehensive Constraint Validation & Quality Assessment
  let horizontalViolations = 0;
  let verticalViolations = 0;
  let diagonalViolations = 0;

  // Group allocated seats by room
  const seatsByRoom = new Map<string, AllocatedSeat[]>();
  allocatedSeats.forEach((seat) => {
    if (!seatsByRoom.has(seat.roomId)) {
      seatsByRoom.set(seat.roomId, []);
    }
    seatsByRoom.get(seat.roomId)!.push(seat);
  });

  seatsByRoom.forEach((rSeats) => {
    // Map seat positions for quick lookup
    const seatMap = new Map<string, AllocatedSeat>();
    rSeats.forEach((s) => {
      seatMap.set(`${s.rowNumber}:${s.colNumber}`, s);
    });

    rSeats.forEach((s) => {
      // Check right neighbor
      const right = seatMap.get(`${s.rowNumber}:${s.colNumber + 1}`);
      if (right && right.subjectCode === s.subjectCode) {
        horizontalViolations++;
      }

      // Check bottom neighbor
      const bottom = seatMap.get(`${s.rowNumber + 1}:${s.colNumber}`);
      if (bottom && bottom.subjectCode === s.subjectCode) {
        verticalViolations++;
      }

      // Check bottom-right diagonal
      const diagBR = seatMap.get(`${s.rowNumber + 1}:${s.colNumber + 1}`);
      if (diagBR && diagBR.subjectCode === s.subjectCode) {
        diagonalViolations++;
      }

      // Check bottom-left diagonal
      const diagBL = seatMap.get(`${s.rowNumber + 1}:${s.colNumber - 1}`);
      if (diagBL && diagBL.subjectCode === s.subjectCode) {
        diagonalViolations++;
      }
    });
  });

  const roomsUtilizedCount = seatsByRoom.size;
  const totalAllocated = allocatedSeats.length;
  const totalSeatsInUsedRooms = Array.from(seatsByRoom.keys()).reduce((sum, rId) => {
    const r = rooms.find((rm) => rm.id === rId);
    return sum + (r ? r.availableSeats : 0);
  }, 0);

  const seatUtilizationPercent =
    totalSeatsInUsedRooms > 0
      ? Math.round((totalAllocated / totalSeatsInUsedRooms) * 100)
      : 0;

  // Compute overall score (0 - 100)
  let rawScore = 100;
  if (totalEligibleCount > 0) {
    const unallocatedPenalty = (unallocatedStudents.length / totalEligibleCount) * 80;
    rawScore -= unallocatedPenalty;
  }
  rawScore -= horizontalViolations * 3;
  rawScore -= verticalViolations * 1.5;
  rawScore -= diagonalViolations * 0.5;

  const overallScore = Math.max(0, Math.min(100, Math.round(rawScore * 10) / 10));

  if (horizontalViolations === 0) {
    notes.push('Zero horizontal same-subject adjacency: Complete side-by-side separation achieved.');
  } else {
    notes.push(`Detected ${horizontalViolations} horizontal same-subject adjacent pairings due to room density constraints.`);
  }

  if (unallocatedStudents.length === 0) {
    notes.push(`100% Allocation Success: All ${totalAllocated} eligible students assigned a dedicated examination seat.`);
  } else {
    notes.push(`${unallocatedStudents.length} students could not be seated due to available room limitations.`);
  }

  const qualityReport: AllocationQualityReport = {
    totalEligible: totalEligibleCount,
    totalAllocated,
    totalUnallocated: unallocatedStudents.length,
    roomsUtilizedCount,
    seatUtilizationPercent,
    sameSubjectHorizontalViolations: horizontalViolations,
    sameSubjectVerticalViolations: verticalViolations,
    sameSubjectDiagonalViolations: diagonalViolations,
    overallScore,
    notes,
  };

  return {
    id: `alloc_${Date.now()}`,
    scheduleIds: schedules.map((s) => s.id),
    examDate,
    shift,
    status: 'draft',
    generatedAt: new Date().toISOString(),
    qualityReport,
    seats: allocatedSeats,
    unallocatedStudents,
    version: 1,
  };
}
