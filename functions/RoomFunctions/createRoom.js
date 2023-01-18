export default function createRoom() {
  const room = new Room();
  RoomsManager.addRoom(room);
  return room;
}
