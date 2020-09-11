import MessageType from "./messageType";

export default  {
    success: new MessageType("✅","#3BF23B"),

    warn: new MessageType("⚠️", "#FFFF00"),

    error: new MessageType("🔴", "#FF3356"),

    info: new MessageType("ℹ️", "#14AACC"),
}