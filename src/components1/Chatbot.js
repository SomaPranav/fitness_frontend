import React, { useState, useRef } from "react";
import axios from "axios";
import { BACKEND_URL } from "../components/Constants";

function Chatbot() {
  const [messages, setMessages] = useState([]); // Chat messages
  const [input, setInput] = useState(""); // User input
  const [isChatOpen, setIsChatOpen] = useState(false); // Chat visibility state
  const [chatDimensions, setChatDimensions] = useState({
    width: 450,
    height: 528,
  }); // Chat dimensions state

  const isResizing = useRef(false); // Ref to track resizing state
  const resizeDirection = useRef(""); // Ref to track which side or corner is being resized
  const lastMousePosition = useRef({ x: 0, y: 0 }); // Store last mouse position during resize

  // Function to handle sending a message
  const handleSendMessage = async () => {
    if (input.trim() !== "") {
      const userMessage = {
        sender: "user",
        text: input,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prevMessages) => [...prevMessages, userMessage]);

      try {
        const response = await axios.post(`${BACKEND_URL}/data/apichatbot`, {
          message: input,
        });

        const botMessage = {
          sender: "bot",
          text: response.data.botMessage,
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
      } catch (error) {
        console.error("Error in chatbot interaction:", error);
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            sender: "bot",
            text: "Bot is currently unavailable.",
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }

      setInput("");
    }
  };

  // Handle Enter key press for sending message
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Toggle chat window visibility
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  // Start resizing when mouse is pressed down on the resizer element
  const startResizing = (e, direction) => {
    isResizing.current = true;
    resizeDirection.current = direction;
    lastMousePosition.current = { x: e.clientX, y: e.clientY };
    window.addEventListener("mousemove", handleResizing);
    window.addEventListener("mouseup", stopResizing);
  };

  // Handle resizing of the chat window when the mouse moves
  const handleResizing = (e) => {
    if (isResizing.current) {
      const dx = e.clientX - lastMousePosition.current.x;
      const dy = e.clientY - lastMousePosition.current.y;

      setChatDimensions((prevDimensions) => {
        let newDimensions = { ...prevDimensions };

        // Determine which direction is being resized and adjust dimensions accordingly
        if (resizeDirection.current.includes("right")) {
          newDimensions.width = Math.min(
            Math.max(prevDimensions.width + dx, 250),
            window.innerWidth - 20
          );
        }
        if (resizeDirection.current.includes("bottom")) {
          newDimensions.height = Math.min(
            Math.max(prevDimensions.height + dy, 250),
            window.innerHeight - 20
          );
        }

        // Update the last mouse position for the next move
        lastMousePosition.current = { x: e.clientX, y: e.clientY };

        return newDimensions;
      });
    }
  };

  // Stop resizing when mouse is released
  const stopResizing = () => {
    isResizing.current = false;
    window.removeEventListener("mousemove", handleResizing);
    window.removeEventListener("mouseup", stopResizing);
  };

  // Function to parse and render bold text on a new line with ":" after it
  const renderFormattedMessage = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/); // Split text by **bold** parts
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        // Handle bold text and ensure colon stays next to bold text
        const cleanText = part.slice(2, -2).replace(/\n/g, ""); // Remove any accidental newlines
        return (
          <span key={index} style={{ fontWeight: "bold" }}>
            {cleanText} {/* The bold text */}
          </span>
        );
      } else {
        return (
          <span key={index} style={{ whiteSpace: "pre-wrap" }}>
            {part.trim() !== "" && part}
          </span>
        );
      }
    });
  };

  return (
    <>
      {/* Chat Icon */}
      {!isChatOpen && (
        <div
          onClick={toggleChat}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: "60px",
            height: "60px",
            backgroundColor: "#77D5CA",
            borderRadius: "50%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.2)",
            color: "#fff",
            fontSize: "24px",
            zIndex: 10000, // Ensure chat icon is on top
          }}
        >
          <i className="bi bi-chat-dots-fill"></i> {/* Chat Icon */}
        </div>
      )}

      {/* Chat Window (Popup) */}
      {isChatOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: `${chatDimensions.width}px`,
            height: `${chatDimensions.height}px`,
            backgroundColor: "#f5f5f5",
            borderRadius: "10px",
            boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.2)",
            display: "flex",
            flexDirection: "column",
            zIndex: 10000, // Ensure chat window is on top of all other elements
          }}
        >
          {/* Chat Header */}
          <div
            style={{
              backgroundColor: "#77D5CA",
              color: "#000",
              padding: "10px",
              borderTopLeftRadius: "10px",
              borderTopRightRadius: "10px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ margin: 0 }}>Chatbot</h3>
            <button
              onClick={toggleChat}
              style={{
                background: "transparent",
                border: "none",
                color: "#000",
                cursor: "pointer",
                fontSize: "18px",
              }}
            >
              ✖
            </button>
          </div>

          {/* Chat messages */}
          <div
            style={{
              flexGrow: 1,
              overflowY: "auto",
              padding: "10px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              backgroundColor: "#D7EEEA",
            }}
          >
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent:
                    message.sender === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    backgroundColor:
                      message.sender === "user" ? "#77D5CA" : "#fff",
                    padding: "10px",
                    borderRadius: "10px",
                    maxWidth: "60%",
                    boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.2)",
                    position: "relative",
                  }}
                >
                  {/* Display the formatted message */}
                  {renderFormattedMessage(message.text)}
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#888",
                      marginTop: "5px",
                      textAlign: "right",
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Input and button section */}
          <div
            style={{
              display: "flex",
              padding: "10px",
              backgroundColor: "#BBE9E2",
              borderTop: "1px solid #ddd",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              style={{
                flexGrow: 1,
                padding: "10px",
                borderRadius: "20px",
                border: "1px solid #ddd",
                marginRight: "10px",
              }}
            />
            <button
              onClick={handleSendMessage}
              style={{
                padding: "10px 15px",
                borderRadius: "50%",
                backgroundColor: "#77D5CA",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              <i className="bi bi-send"></i>
            </button>
          </div>

          {/* Resizable Borders (Right, Bottom, and Corner) */}
          <div
            onMouseDown={(e) => startResizing(e, "right")}
            style={{
              position: "absolute",
              top: "0",
              right: "0",
              width: "10px",
              height: "100%",
              cursor: "ew-resize",
              zIndex: "10",
            }}
          />
          <div
            onMouseDown={(e) => startResizing(e, "bottom")}
            style={{
              position: "absolute",
              bottom: "0",
              left: "0",
              width: "100%",
              height: "10px",
              cursor: "ns-resize",
              zIndex: "10",
            }}
          />
          <div
            onMouseDown={(e) => startResizing(e, "right bottom")}
            style={{
              position: "absolute",
              bottom: "0",
              right: "0",
              width: "20px",
              height: "20px",
              cursor: "nwse-resize",
              zIndex: "10",
            }}
          />
        </div>
      )}
    </>
  );
}

export default Chatbot;
