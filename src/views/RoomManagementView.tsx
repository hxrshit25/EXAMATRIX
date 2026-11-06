import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import { Room, RoomLayoutConfig } from '../types';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Armchair,
  Ban,
  CheckCircle2,
  Accessibility,
  Sliders,
  X,
  Layers,
  Save,
} from 'lucide-react';

export const RoomManagementView: React.FC = () => {
  const { refreshTrigger, triggerRefresh, showToast } = useApp();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Active room for visual layout designer
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);

  // Add Room Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    roomNumber: '',
    building: 'Aryabhata Academic Block',
    floor: 0,
    totalRows: 6,
    totalColumns: 8,
    roomType: 'Examination Hall' as Room['roomType'],
    accessibilityInfo: 'Wheelchair Accessible, Ground Floor',
    isAvailable: true,
  });

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await api.getRooms();
      setRooms(data);
      if (data.length > 0 && !activeRoom) {
        setActiveRoom(data[0]);
      } else if (activeRoom) {
        const refreshed = data.find((r) => r.id === activeRoom.id);
        if (refreshed) setActiveRoom(refreshed);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, [refreshTrigger]);

  const handleToggleBlocked = (row: number, col: number) => {
    if (!activeRoom) return;
    const seatCode = `R${row}C${col}`;
    const blocked = new Set(activeRoom.layoutConfig.blockedSeats || []);

    if (blocked.has(seatCode)) {
      blocked.delete(seatCode);
    } else {
      blocked.add(seatCode);
    }

    const updatedConfig: RoomLayoutConfig = {
      ...activeRoom.layoutConfig,
      blockedSeats: Array.from(blocked),
    };

    setActiveRoom({
      ...activeRoom,
      layoutConfig: updatedConfig,
      availableSeats: activeRoom.totalRows * activeRoom.totalColumns - blocked.size,
    });
  };

  const handleToggleAisle = (colIndex: number) => {
    if (!activeRoom) return;
    const aisles = new Set(activeRoom.layoutConfig.aisles || []);

    if (aisles.has(colIndex)) {
      aisles.delete(colIndex);
    } else {
      aisles.add(colIndex);
    }

    const updatedConfig: RoomLayoutConfig = {
      ...activeRoom.layoutConfig,
      aisles: Array.from(aisles).sort((a, b) => a - b),
    };

    setActiveRoom({
      ...activeRoom,
      layoutConfig: updatedConfig,
    });
  };

  const handleSaveLayout = async () => {
    if (!activeRoom) return;
    try {
      await api.updateRoom(activeRoom.id, {
        totalRows: activeRoom.totalRows,
        totalColumns: activeRoom.totalColumns,
        layoutConfig: activeRoom.layoutConfig,
      });
      showToast(`Layout for Room ${activeRoom.roomNumber} saved successfully.`, 'success');
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roomNumber.trim()) {
      showToast('Room number is required.', 'error');
      return;
    }

    try {
      const created = await api.createRoom({
        ...formData,
        roomNumber: formData.roomNumber.trim().toUpperCase(),
        seatCapacity: formData.totalRows * formData.totalColumns,
        layoutConfig: {
          blockedSeats: [],
          aisles: [Math.floor(formData.totalColumns / 2)],
        },
      });
      showToast(`Room ${created.roomNumber} created.`, 'success');
      setIsAddModalOpen(false);
      setActiveRoom(created);
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteRoom = async (room: Room) => {
    if (window.confirm(`Delete examination room ${room.roomNumber}?`)) {
      try {
        await api.deleteRoom(room.id);
        showToast(`Room ${room.roomNumber} removed.`, 'success');
        if (activeRoom?.id === room.id) {
          setActiveRoom(null);
        }
        triggerRefresh();
      } catch (err: any) {
        showToast(err.message, 'error');
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Examination Halls & Classroom Layouts</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              {rooms.length} Halls
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure rectangular seating geometries, walking aisles, disabled furniture, and accessibility
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Examination Room</span>
        </button>
      </div>

      {/* 2-Column Split: Room Cards Drawer on Left, Visual Classroom Layout Configurator on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (4 cols): Rooms Directory */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
            Halls & Classrooms
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {rooms.map((room) => {
              const isSelected = activeRoom?.id === room.id;
              const blockedCount = (room.layoutConfig.blockedSeats || []).length;

              return (
                <div
                  key={room.id}
                  onClick={() => setActiveRoom(room)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-500 dark:border-blue-500 ring-1 ring-blue-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                        {room.roomNumber}
                      </span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {room.roomType}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {room.floor === 0 && (
                        <span
                          className="text-blue-600 dark:text-blue-400"
                          title="Ground Floor Ramp Access"
                        >
                          <Accessibility className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRoom(room);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                        title="Delete Room"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">
                    {room.building} · {room.floor === 0 ? 'Ground Floor' : `Floor ${room.floor}`}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 tabular-nums">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {room.availableSeats} Usable
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">{room.seatCapacity} Total</span>
                    </div>

                    {blockedCount > 0 && (
                      <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                        {blockedCount} Blocked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (8 cols): Interactive Classroom Layout Configurator */}
        <div className="lg:col-span-8">
          {activeRoom ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Layout Designer: Hall {activeRoom.roomNumber}
                    </h2>
                    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {activeRoom.isAvailable ? 'ACTIVE FOR EXAMS' : 'OFFLINE'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeRoom.building} · {activeRoom.accessibilityInfo}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveLayout}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Layout Changes</span>
                  </button>
                </div>
              </div>

              {/* Geometry Controls Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">Total Rows</label>
                  <input
                    type="number"
                    min={3}
                    max={15}
                    value={activeRoom.totalRows}
                    onChange={(e) => {
                      const val = Math.max(3, Math.min(15, parseInt(e.target.value, 10) || 3));
                      setActiveRoom({
                        ...activeRoom,
                        totalRows: val,
                        seatCapacity: val * activeRoom.totalColumns,
                        availableSeats:
                          val * activeRoom.totalColumns -
                          (activeRoom.layoutConfig.blockedSeats || []).length,
                      });
                    }}
                    className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Columns / Benches</label>
                  <input
                    type="number"
                    min={4}
                    max={16}
                    value={activeRoom.totalColumns}
                    onChange={(e) => {
                      const val = Math.max(4, Math.min(16, parseInt(e.target.value, 10) || 4));
                      setActiveRoom({
                        ...activeRoom,
                        totalColumns: val,
                        seatCapacity: activeRoom.totalRows * val,
                        availableSeats:
                          activeRoom.totalRows * val -
                          (activeRoom.layoutConfig.blockedSeats || []).length,
                      });
                    }}
                    className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Gross Capacity</label>
                  <div className="font-mono font-bold text-slate-800 dark:text-slate-200 py-1">
                    {activeRoom.totalRows * activeRoom.totalColumns} Seats
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Net Usable Capacity</label>
                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 py-1">
                    {activeRoom.availableSeats} Available
                  </div>
                </div>
              </div>

              {/* Legend & Instructions */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-400 gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded bg-blue-100 dark:bg-blue-900/60 border border-blue-400" />
                    <span>Usable Seat</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded bg-rose-100 dark:bg-rose-950 border border-rose-300 dark:border-rose-800" />
                    <span>Blocked Seat</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-4 border-r-2 border-dashed border-amber-500" />
                    <span>Walking Aisle</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">
                  Tip: Click any seat to block/unblock. Click aisle buttons above columns to toggle walkway gaps.
                </div>
              </div>

              {/* Classroom Layout Blackboard Front */}
              <div className="space-y-4">
                <div className="p-2.5 rounded-lg bg-slate-800 dark:bg-slate-950 text-slate-200 text-center text-xs font-mono font-semibold tracking-wider uppercase border border-slate-700 shadow-inner flex items-center justify-center gap-2">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <span>Front of Hall · Invigilator Podium & Proctor Desk</span>
                </div>

                {/* Aisle Toggles Bar */}
                <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">Toggle Aisle After:</span>
                  {Array.from({ length: activeRoom.totalColumns - 1 }).map((_, cIdx) => {
                    const colNum = cIdx + 1;
                    const hasAisle = (activeRoom.layoutConfig.aisles || []).includes(colNum);
                    return (
                      <button
                        key={colNum}
                        onClick={() => handleToggleAisle(colNum)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${
                          hasAisle
                            ? 'bg-amber-500 text-white font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                        title={`Toggle Aisle after Column ${colNum}`}
                      >
                        Col {colNum}
                      </button>
                    );
                  })}
                </div>

                {/* The Seating Grid */}
                <div className="overflow-x-auto p-4 bg-slate-50/50 dark:bg-slate-950/30 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="inline-block min-w-full space-y-2">
                    {Array.from({ length: activeRoom.totalRows }).map((_, rIdx) => {
                      const rowNum = rIdx + 1;
                      return (
                        <div key={rowNum} className="flex items-center justify-center gap-1.5">
                          {/* Row label */}
                          <div className="w-7 text-[11px] font-mono font-bold text-slate-400 text-right pr-2 shrink-0">
                            R{rowNum}
                          </div>

                          {/* Columns */}
                          {Array.from({ length: activeRoom.totalColumns }).map((_, cIdx) => {
                            const colNum = cIdx + 1;
                            const seatCode = `R${rowNum}C${colNum}`;
                            const isBlocked = (activeRoom.layoutConfig.blockedSeats || []).includes(
                              seatCode
                            );
                            const isAisleAfter = (activeRoom.layoutConfig.aisles || []).includes(
                              colNum
                            );

                            return (
                              <React.Fragment key={seatCode}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleBlocked(rowNum, colNum)}
                                  className={`w-9 h-9 rounded-md flex flex-col items-center justify-center text-[10px] font-mono transition-transform hover:scale-105 select-none ${
                                    isBlocked
                                      ? 'bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                                      : 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 hover:border-blue-400'
                                  }`}
                                  title={`Seat R${rowNum}-C${colNum}: Click to ${
                                    isBlocked ? 'unblock' : 'block'
                                  }`}
                                >
                                  {isBlocked ? (
                                    <Ban className="w-3.5 h-3.5 text-rose-500" />
                                  ) : (
                                    <>
                                      <Armchair className="w-3.5 h-3.5 opacity-60" />
                                      <span className="text-[8px] font-semibold">
                                        {String(colNum).padStart(2, '0')}
                                      </span>
                                    </>
                                  )}
                                </button>

                                {/* Aisle visual spacer */}
                                {isAisleAfter && (
                                  <div
                                    className="w-4 h-9 flex items-center justify-center text-slate-300 dark:text-slate-700 font-mono text-[9px] shrink-0 border-x border-dashed border-amber-300 dark:border-amber-900/50"
                                    title="Walking Aisle"
                                  >
                                    |
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              Select an examination room on the left to configure its classroom seating arrangement.
            </div>
          )}
        </div>
      </div>

      {/* Add Room Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Add Examination Hall or Classroom
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRoom} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Room Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder="e.g. H-204"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Floor Level *
                  </label>
                  <select
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  >
                    <option value={0}>Ground Floor (Floor 0)</option>
                    <option value={1}>Floor 1</option>
                    <option value={2}>Floor 2</option>
                    <option value={3}>Floor 3</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Building / Academic Block
                </label>
                <input
                  type="text"
                  required
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  placeholder="e.g. Ramanujan Mathematical Complex"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Total Rows
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={15}
                    value={formData.totalRows}
                    onChange={(e) => setFormData({ ...formData, totalRows: parseInt(e.target.value, 10) || 3 })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Columns / Benches
                  </label>
                  <input
                    type="number"
                    min={4}
                    max={16}
                    value={formData.totalColumns}
                    onChange={(e) => setFormData({ ...formData, totalColumns: parseInt(e.target.value, 10) || 4 })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Accessibility Notes
                </label>
                <input
                  type="text"
                  value={formData.accessibilityInfo}
                  onChange={(e) => setFormData({ ...formData, accessibilityInfo: e.target.value })}
                  placeholder="e.g. Wheelchair Accessible, Elevator Access, Ground Floor"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Create Hall
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
