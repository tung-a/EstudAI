import { auth, db } from "@/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const logFirebaseEvent = async (eventName: string, extraData?: object) => {
  try {
    const user = auth.currentUser;
    await addDoc(collection(db, "analytics_events"), {
      eventName,
      userId: user ? user.uid : "anonymous",
      createdAt: serverTimestamp(),
      ...extraData,
    });
  } catch (error) {
    console.error("Error logging event to Firestore: ", error);
  }
};

export const logLogin = () => {
  logFirebaseEvent("login");
};

export const logSignUp = () => {
  logFirebaseEvent("sign_up");
};

export const logAddEventCalendar = () => {
  logFirebaseEvent("add_event_calendar");
};

export const logDeleteEventCalendar = () => {
  logFirebaseEvent("delete_event_calendar");
};

export const logSendMessage = () => {
  logFirebaseEvent("send_message_chat");
};

export const logAddConversation = () => {
  logFirebaseEvent("add_conversation");
};

export const logDeleteConversation = () => {
  logFirebaseEvent("delete_conversation");
};
