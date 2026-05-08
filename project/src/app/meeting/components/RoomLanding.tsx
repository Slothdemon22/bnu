import { useState } from "react";
import Navbar from "@/components/custom/Navbar";
import Footer from "@/components/custom/Footer";

interface RoomLandingProps {
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
}

export default function RoomLanding({ onCreateRoom, onJoinRoom }: RoomLandingProps) {
  const [roomId, setRoomId] = useState("");

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 border border-stone-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Online Meeting
        </h1>
        
        <div className="space-y-4">
          <button
            onClick={onCreateRoom}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Create New Room
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or join existing</span>
            </div>
          </div>
          
          <div>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter Room ID"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-900 text-stone-900 dark:text-white"
            />
          </div>
          
          <button
            onClick={() => {
              if (roomId.trim()) {
                onJoinRoom(roomId.trim());
              }
            }}
            disabled={!roomId.trim()}
            className="w-full bg-stone-600 hover:bg-stone-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}

