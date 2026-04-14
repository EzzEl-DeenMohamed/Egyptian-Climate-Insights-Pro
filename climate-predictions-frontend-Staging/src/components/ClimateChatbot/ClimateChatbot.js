import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  Slide,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";

const FALLBACK_ANSWER =
  "Sorry, I can't understand this input. Please enter a number from the menu.";

// eslint-disable-next-line no-undef
const API_BASE_URL = process.env.REACT_APP_BACKEND_API_BASE_URL;
const QUESTIONS_API_URL = `${API_BASE_URL}/climate/analysis/chatbot/questions`;
const ANSWER_API_URL = `${API_BASE_URL}/climate/analysis/chatbot/answer/`;

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const avatarSize = 64;

const ClimateChatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Welcome! Please choose a question by entering its number.",
    },
  ]);
  const [input, setInput] = useState("");
  const [questions, setQuestions] = useState([]); // fetched questions
  const [loading, setLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const messagesEndRef = useRef(null);
  const [awaitingAskAgain, setAwaitingAskAgain] = useState(false);

  useEffect(() => {
    if (open) {
      fetchQuestions();
    }
  }, [open]);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const response = await fetch(QUESTIONS_API_URL);
      if (response.ok) {
        const data = await response.json();
        setQuestions(Array.isArray(data) ? data : []);
        setMessages([
          { from: "bot", text: "Welcome! Please choose a question by entering its number." },
          { from: "bot", text: getMenuText(Array.isArray(data) ? data : []) },
        ]);
      } else {
        setQuestions([]);
        setMessages([{ from: "bot", text: "Sorry, there was an error fetching the questions." }]);
      }
    } catch (e) {
      setQuestions([]);
      setMessages([{ from: "bot", text: "Sorry, there was an error fetching the questions." }]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { from: "user", text: input.trim() }]);
    setInput("");

    if (awaitingAskAgain) {
      if (trimmed === "1") {
        setMessages((prev) => [...prev, { from: "bot", text: getMenuText(questions) }]);
        setAwaitingAskAgain(false);
      } else if (trimmed === "0") {
        setMessages((prev) => [
          ...prev,
          { from: "bot", text: "Thank you for using the Climate Assistant!" },
        ]);
        setAwaitingAskAgain(false);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            from: "bot",
            text: "Please enter 1 for yes or 0 for no. Do you want to ask another question?",
          },
        ]);
      }
      return;
    }

    if (!/^[0-9]+$/.test(trimmed)) {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: FALLBACK_ANSWER },
        { from: "bot", text: getMenuText(questions) },
      ]);
      return;
    }
    const idx = parseInt(trimmed, 10) - 1;
    if (idx >= 0 && idx < questions.length) {
      setLoading(true);
      const question = questions[idx];
      try {
        const response = await fetch(`${ANSWER_API_URL}${question.question_id}`);
        let answer = "No answer found.";
        if (response.ok) {
          const data = await response.json();
          if (data && data.answer) {
            const ans = data.answer;
            answer = `Location: ${ans.location_name}\nMonth: ${ans.month}\nYear: ${ans.year}\nValue: ${ans.value} ${ans.unit}\nParameter: ${ans.clm_param_name}`;
          }
        } else {
          answer = "Sorry, there was an error fetching the answer.";
        }
        setMessages((prev) => [
          ...prev,
          { from: "bot", text: answer },
          { from: "bot", text: "Do you want to ask another question? (Enter 1 for yes, 0 for no)" },
        ]);
        setAwaitingAskAgain(true);
      } catch (e) {
        setMessages((prev) => [
          ...prev,
          { from: "bot", text: "Sorry, there was an error fetching the answer." },
          { from: "bot", text: "Do you want to ask another question? (Enter 1 for yes, 0 for no)" },
        ]);
        setAwaitingAskAgain(true);
      } finally {
        setLoading(false);
      }
    } else {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: FALLBACK_ANSWER },
        { from: "bot", text: getMenuText(questions) },
      ]);
    }
  };

  function getMenuText(questionsList) {
    if (!questionsList || questionsList.length === 0) return "No questions available.";
    return (
      "Please choose a question by entering its number:\n" +
      questionsList
        .map((item, idx) => `  ${idx + 1}. ${item.text || item.question || item}`)
        .join("\n")
    );
  }

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  // Reset conversation when chatbot is reopened
  useEffect(() => {
    if (open) {
      setAwaitingAskAgain(false);
    }
  }, [open]);

  return (
    <>
      {/* Overlay when chatbot is open */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(25, 118, 210, 0.08)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
            zIndex: 1399,
          }}
        />
      )}

      {/* Floating Chatbot Button */}
      {!open && (
        <Button
          variant="contained"
          sx={{
            position: "fixed",
            bottom: 36,
            right: 36,
            minWidth: avatarSize,
            minHeight: avatarSize,
            width: avatarSize,
            height: avatarSize,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1976d2, #42a5f5)",
            boxShadow: 3,
            zIndex: 1400,
            p: 0,
            fontSize: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": {
              background: "linear-gradient(135deg, #1565c0, #42a5f5)",
              transform: "scale(1.07)",
              boxShadow: 6,
            },
          }}
          aria-label="Open Climate Chatbot"
          onClick={() => setOpen(true)}
        >
          🤖
        </Button>
      )}

      {/* Chatbot Modal */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        TransitionComponent={Transition}
        keepMounted
        hideBackdrop
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxWidth: 360,
            minWidth: 280,
            width: "94vw",
            m: 0,
            p: 0,
            boxShadow: 8,
            background: "#fff",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            height: { xs: 480, sm: 520 },
            position: "fixed",
            bottom: 36,
            right: 36,
            zIndex: 1500,
          },
        }}
        sx={{ zIndex: 1500 }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#1976d2",
            color: "#fff",
            px: 2,
            py: 1.5,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} letterSpacing={1}>
            Climate Assistant
          </Typography>
          <IconButton
            onClick={() => setOpen(false)}
            sx={{ color: "#fff" }}
            aria-label="Close chatbot"
          >
            <CloseIcon />
          </IconButton>
        </Box>
        {/* Chat Body */}
        <DialogContent
          sx={{
            background: "#f5f8fd",
            flex: 1,
            p: 0,
            m: 0,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
          }}
        >
          <Box sx={{ flex: 1, p: 2, pb: 0, display: "flex", flexDirection: "column", gap: 1 }}>
            {messages.map((msg, i) => (
              <Box
                key={i}
                sx={{
                  alignSelf: msg.from === "user" ? "flex-end" : "flex-start",
                  maxWidth: "90%",
                  mb: 0.5,
                  display: "flex",
                  flexDirection: msg.from === "user" ? "row-reverse" : "row",
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    bgcolor: msg.from === "user" ? "#1976d2" : "#fff",
                    color: msg.from === "user" ? "#fff" : "#1976d2",
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    fontSize: 15,
                    boxShadow: msg.from === "user" ? 2 : 1,
                    whiteSpace: "pre-line",
                  }}
                >
                  {msg.text}
                </Box>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>
        </DialogContent>
        {/* Input */}
        <Box sx={{ display: "flex", alignItems: "center", p: 1.5, background: "#f5f8fd" }}>
          <TextField
            fullWidth
            size="small"
            placeholder={
              loading || loadingQuestions ? "Loading..." : "Type a number and press Enter..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            disabled={loading || loadingQuestions}
            sx={{
              background: "#fff",
              borderRadius: 2,
              mr: 1,
              input: { color: "#1976d2", fontWeight: 500 },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleSend}
                    disabled={loading || loadingQuestions}
                    sx={{ color: "#1976d2" }}
                    aria-label="Send"
                  >
                    <SendIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Dialog>
    </>
  );
};

export default ClimateChatbot;
