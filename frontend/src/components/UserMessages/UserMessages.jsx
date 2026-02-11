// UserMessages.jsx - Fixed Version with Proper Initial Message Loading
import styles from "./UserMessages.module.css"
import Profiles from "../../components/Profiles/Profiles"
import ProfileImg from "../../../public/UserProfileImg.webp"
import search from "../../../public/search.svg"
import settings from "../../../public/Settings.svg"
import sendButton from "../../../public/send.svg"

import Message from "../../components/Message/Message.jsx"

import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"

import { connectSocket } from "../../sockets/socket.js";

const MESSAGES_PER_PAGE = 15;

const UserMesssages = () => {

    const navigate = useNavigate();
    
    const [contacts, setContacts] = useState([]);
    const [currentContact, SetCurrentContact] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
    const [socket, setSocket] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMoreMessages, setHasMoreMessages] = useState(false);
    const [totalMessagesCount, setTotalMessagesCount] = useState(0);

    const handleGoToSettings = () => {          
        navigate("../Settings");
    }

    // Fetch conversations (with ONLY last message) on component mount
    useEffect(() => {
        const initializeMessaging = async () => {
            try {
                setIsLoading(true);
                
                const UserData = {
                    id: JSON.parse(localStorage.getItem("user")).User_id,
                    type: "user"
                };

                // Connect to socket with user data
                const connectedSocket = connectSocket(UserData);
                setSocket(connectedSocket);

                // Fetch conversations with last message
                const response = await fetch(
                    `https://quickhire-4d8p.onrender.com/api/User/ConversationsWithLastMessage?UserId=${UserData.id}&UserType=${UserData.type}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const conversations = await response.json();
                console.log("Conversations loaded:", conversations);

                const initialContactsProfiles = conversations.map(conversation => {
                    const { profile, LastMessage } = conversation;
                    
                    return {
                        'ConversationId': profile.ConversationId,
                        'id': profile.Company_id,
                        'ProfileImg': profile.Logo || ProfileImg,
                        'Name': profile.Name,
                        'CurrentRole': profile.Website || "",
                        'LastMessageContent': LastMessage ? LastMessage.Content : `Start Your Conversation with ${profile.Name}`,
                        'LastMessageDate': LastMessage ? LastMessage.Date : null,
                        'Messages': [],
                        'UnreadCount': 0,
                        'MessagesLoaded': false
                    };
                });

                // Sort by latest message timestamp (most recent first)
                const sortedProfiles = initialContactsProfiles.sort((a, b) => {
                    if (!a.LastMessageDate) return 1;
                    if (!b.LastMessageDate) return -1;
                    return new Date(b.LastMessageDate) - new Date(a.LastMessageDate);
                });

                setContacts(sortedProfiles);

                // Auto-select first contact AND load its messages immediately
                if (sortedProfiles.length > 0) {
                    const firstContact = sortedProfiles[0];
                    SetCurrentContact(firstContact);
                    
                    // Load messages for first contact immediately
                    await loadMessagesForSpecificContact(firstContact, sortedProfiles);
                }

            } catch (error) {
                console.error("Error initializing messaging:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeMessaging();
    }, []);

    // Function to load messages for a specific contact
    const loadMessagesForSpecificContact = async (contact, contactsList) => {
        if (!contact || !contact.ConversationId) {
            console.log("No contact or conversation ID");
            return;
        }

        // Skip if already loaded
        if (contact.MessagesLoaded) {
            console.log("Messages already loaded for this contact");
            return;
        }

        try {
            setIsLoadingMessages(true);
            console.log(`Loading messages for conversation ${contact.ConversationId}`);

            // Fetch recent messages (last 15)
            const response = await fetch(
                `https://quickhire-4d8p.onrender.com/api/User/Conversations/${contact.ConversationId}/Messages/recent?limit=${MESSAGES_PER_PAGE}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Recent messages loaded:", data);

            // Transform messages to match your format
            const formattedMessages = data.messages.map(msg => ({
                Role: msg.Sender === "user" ? "sender" : "receiver",
                Content: msg.Content,
                Date: msg.Date,
                isRead: true
            }));

            // Update contact with loaded messages
            const updatedContact = {
                ...contact,
                Messages: formattedMessages,
                MessagesLoaded: true
            };

            // Update in contacts list
            const updatedContacts = (contactsList || contacts).map(c =>
                c.id === updatedContact.id ? updatedContact : c
            );

            setContacts(updatedContacts);
            SetCurrentContact(updatedContact);

            // Set pagination state
            setCurrentPage(1);
            setHasMoreMessages(data.messages.length === MESSAGES_PER_PAGE);

        } catch (error) {
            console.error("Error loading messages:", error);
        } finally {
            setIsLoadingMessages(false);
        }
    };

    // Load messages when a contact is selected (for subsequent selections)
    useEffect(() => {
        if (!currentContact || !currentContact.ConversationId || isLoading) {
            return;
        }

        // Skip if it's the initial load (messages already loaded in initializeMessaging)
        if (currentContact.MessagesLoaded) {
            return;
        }

        loadMessagesForSpecificContact(currentContact, contacts);
    }, [currentContact?.id]); // Changed dependency to id instead of ConversationId

    // Load more messages (pagination)
    const loadMoreMessages = async () => {
        if (!currentContact || !hasMoreMessages || isLoadingMoreMessages) {
            return;
        }

        try {
            setIsLoadingMoreMessages(true);
            const nextPage = currentPage + 1;
            console.log(`Loading page ${nextPage} for conversation ${currentContact.ConversationId}`);

            const response = await fetch(
                `https://quickhire-4d8p.onrender.com/api/User/Conversations/${currentContact.ConversationId}/Messages/paginated?page=${nextPage}&limit=${MESSAGES_PER_PAGE}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("More messages loaded:", data);

            // Transform new messages
            const newMessages = data.messages.map(msg => ({
                Role: msg.Sender === "user" ? "sender" : "receiver",
                Content: msg.Content,
                Date: msg.Date,
                isRead: true
            }));

            // PREPEND old messages (they come before current messages)
            const updatedMessages = [...newMessages, ...currentContact.Messages];

            const updatedContact = {
                ...currentContact,
                Messages: updatedMessages
            };

            const updatedContacts = contacts.map(c =>
                c.id === updatedContact.id ? updatedContact : c
            );

            setContacts(updatedContacts);
            SetCurrentContact(updatedContact);

            // Update pagination state
            setCurrentPage(nextPage);
            setHasMoreMessages(data.pagination.hasMore);
            setTotalMessagesCount(data.pagination.totalCount);

        } catch (error) {
            console.error("Error loading more messages:", error);
        } finally {
            setIsLoadingMoreMessages(false);
        }
    };

    // Local Storage
    const PersonalInfo = {
        ProfileImg: localStorage.getItem("Image"),
    }

    const [MessageInput, SetMessageInput] = useState("");
    const [SearchingContacts, setSearchingContacts] = useState(contacts);

    // Update searching contacts when contacts change
    useEffect(() => {
        setSearchingContacts(contacts);
    }, [contacts]);

    // Mobile responsiveness
    const [isPhone, setIsPhone] = useState(() => (typeof window !== 'undefined' && window.innerWidth <= 600));
    const [mobileView, setMobileView] = useState(() => (typeof window !== 'undefined' && window.innerWidth <= 600) ? 'list' : 'both');

    useEffect(() => {
        const handleResize = () => {
            const phone = window.innerWidth <= 600;
            setIsPhone(phone);
            setMobileView(prev => {
                if (!phone) return 'both';
                if (phone && prev === 'both') return 'list';
                return prev;
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleContactSelected = (contact) => {
        console.log("Contact selected:", contact.Name);
        
        // If selecting the same contact, don't reload
        if (currentContact && currentContact.id === contact.id) {
            if (isPhone) setMobileView('chat');
            return;
        }

        SetCurrentContact(contact);
        
        // Mark all messages as read when conversation is opened
        const updatedContacts = contacts.map(c => {
            if (c.id === contact.id) {
                return {
                    ...c,
                    Messages: c.Messages.map(msg => ({ ...msg, isRead: true })),
                    UnreadCount: 0
                };
            }
            return c;
        });
        setContacts(updatedContacts);

        // Reset pagination for new contact
        setCurrentPage(1);
        setHasMoreMessages(false);
        
        if (isPhone) setMobileView('chat');
    }

    // Get active contact safely
    const activeContactId = currentContact ? currentContact.id : null;
    const displayedContact = contacts.find(c => c.id === activeContactId) || contacts[0];

    const handleSendMessage = () => {
        const messageContent = MessageInput.trim();

        if (messageContent.length === 0) {
            return;
        }

        if (socket) {
            socket.emit("send_message", {
                conversationId: currentContact.ConversationId,
                content: messageContent
            });
        }

        const updatedMessages = [...displayedContact.Messages, {
            Role: "sender",
            Content: messageContent,
            isRead: true,
            Date: new Date()
        }];

        const updatedContact = {
            ...displayedContact,
            Messages: updatedMessages,
            LastMessageContent: messageContent,
            LastMessageDate: new Date()
        };

        const updatedContacts = contacts.map(c =>
            c.id === updatedContact.id ? updatedContact : c
        );

        setContacts(updatedContacts);
        SetCurrentContact(updatedContact);

        SetMessageInput("");
    }

    const handleInputEntering = (event) => {
        SetMessageInput(event.target.value);
    }

    // Socket listener for incoming messages
    useEffect(() => {
        if (!socket) return;

        socket.on("receive_message", (message) => {
            console.log("Received message:", message);

            const isSender = socket.user && socket.user.type === "user";
            const isCurrentConversation = currentContact?.ConversationId === message.ConversationId;

            const newMessage = {
                Role: isSender ? "sender" : "receiver",
                Content: message.Content,
                Date: message.Date,
                isRead: isCurrentConversation
            };

            const senderContact = contacts.find(c => c.ConversationId === message.ConversationId);

            if (!senderContact) {
                console.log("No contact found for this conversation");
                return;
            }

            const updatedMessages = [...senderContact.Messages, newMessage];
            const newUnreadCount = isCurrentConversation ? 0 : (senderContact.UnreadCount || 0) + 1;

            const updatedContact = {
                ...senderContact,
                Messages: updatedMessages,
                UnreadCount: newUnreadCount,
                LastMessageContent: message.Content,
                LastMessageDate: message.Date
            };

            const updatedContacts = contacts.map(c =>
                c.id === updatedContact.id ? updatedContact : c
            );

            setContacts(updatedContacts);

            if (isCurrentConversation) {
                SetCurrentContact(updatedContact);
            }
        });

        return () => {
            socket.off("receive_message");
        };
    }, [socket, contacts, currentContact]);

    // Scroll management
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const prevScrollHeightRef = useRef(0);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    // Scroll to bottom on new messages
    useEffect(() => {
        if (!isLoadingMessages) {
            scrollToBottom();
        }
    }, [displayedContact?.Messages?.length, displayedContact?.id, isLoadingMessages]);

    // Handle scroll to load more messages
    const handleScroll = () => {
        if (!messagesContainerRef.current || isLoadingMoreMessages || !hasMoreMessages) return;

        const { scrollTop } = messagesContainerRef.current;

        // If scrolled near top (within 100px), load more messages
        if (scrollTop < 100) {
            const prevHeight = messagesContainerRef.current.scrollHeight;
            prevScrollHeightRef.current = prevHeight;
            
            loadMoreMessages();
        }
    };

    // Maintain scroll position after loading more messages
    useEffect(() => {
        if (messagesContainerRef.current && prevScrollHeightRef.current > 0) {
            const newHeight = messagesContainerRef.current.scrollHeight;
            const heightDiff = newHeight - prevScrollHeightRef.current;
            messagesContainerRef.current.scrollTop = heightDiff;
            prevScrollHeightRef.current = 0;
        }
    }, [displayedContact?.Messages?.length]);

    const handleSearchingContact = (e) => {
        const q = (e.target.value || "").trim().toLowerCase();
        if (q === "") {
            setSearchingContacts(contacts);
            return;
        }

        const SearchResult = contacts.filter(contact => (contact.Name || "").toLowerCase().includes(q));
        setSearchingContacts(SearchResult);
    }

    // Skeleton placeholders for profiles
    const ProfileSkeletons = () => (
        <div className={styles.Profiles}>
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`${styles.ProfileSkeleton} ${styles.skeleton}`}>
                    <div className={`${styles.skeletonImg} ${styles.skeleton}`}></div>
                    <div className={styles.skeletonDetails}>
                        <div className={`${styles.skeletonName} ${styles.skeleton}`}></div>
                        <div className={`${styles.skeletonMessage} ${styles.skeleton}`}></div>
                    </div>
                </div>
            ))}
        </div>
    );

    // Skeleton placeholders for messages
    const MessageSkeletons = () => (
        <div className={styles.Messages}>
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`${styles.MessageSkeleton} ${styles.skeleton}`}>
                    <div className={`${styles.skeletonMsgImg} ${styles.skeleton}`}></div>
                    <div className={`${styles.skeletonMsgContent} ${styles.skeleton}`}></div>
                </div>
            ))}
        </div>
    );

    return (
        <>
            {isLoading ? (
                <div className={styles.MessagePage}>
                    <div className={styles.FirstPart}>
                        <div className={styles.SearchBar}>
                            <img src={search} alt="Search icon" />
                            <input placeholder="Search for Message" disabled />
                        </div>
                        <ProfileSkeletons />
                    </div>

                    <div className={styles.SecondPart}>
                        <div className={`${styles.ChatNav} ${styles.skeleton}`}>
                            <div className={styles.UserInfo}>
                                <div className={`${styles.skeletonImg} ${styles.skeleton}`}></div>
                                <div className={styles.ProfileDetails}>
                                    <div className={`${styles.skeletonName} ${styles.skeleton}`}></div>
                                    <div className={`${styles.skeletonMessage} ${styles.skeleton}`}></div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.MessagesPart}>
                            <MessageSkeletons />
                        </div>

                        <div className={styles.MessageInput}>
                            <textarea placeholder="send a message" disabled />
                            <img src={sendButton} alt="Send button" style={{ opacity: 0.5 }} />
                        </div>
                    </div>
                </div>
            ) : !displayedContact ? (
                <div className={styles.MessagePage}>
                    <p>No conversations found</p>
                </div>
            ) : (
                <div className={`${styles.MessagePage} ${mobileView === 'list' ? styles.showList : mobileView === 'chat' ? styles.showChat : ''}`}>

                    <div className={styles.FirstPart}>
                        <div className={styles.SearchBar}>
                            <img src={search} alt="Search icon" />
                            <input placeholder="Search for Message" onChange={handleSearchingContact} />
                        </div>

                        <Profiles
                            ContactsProfiles={SearchingContacts}
                            handleChoseProfile={handleContactSelected}
                            activeContactId={activeContactId}
                        />
                    </div>

                    <div className={styles.SecondPart}>
                        <div className={styles.ChatNav}>
                            {isPhone && mobileView === 'chat' && (
                                <button className={styles.BackButton} onClick={() => setMobileView('list')} aria-label="Back to conversations">←</button>
                            )}

                            <div className={styles.UserInfo}>
                                <img src={displayedContact.ProfileImg} alt="Profile" />
                                <div className={styles.ProfileDetails}>
                                    <h6>{displayedContact.Name}</h6>
                                    <p>{displayedContact.CurrentRole}</p>
                                </div>
                            </div>

                            <img src={settings} onClick={handleGoToSettings} className={styles.SettingsImg} alt="Settings icon" />
                        </div>

                        <div 
                            className={`${styles.MessagesPart} ${isLoadingMessages ? styles.MessagesPartLoading : ''}`}
                            ref={messagesContainerRef}
                            onScroll={handleScroll}
                        >
                            {/* Loading indicator for more messages */}
                            {isLoadingMoreMessages && (
                                <div className={styles.LoadingMore}>
                                    <p>Loading older messages...</p>
                                </div>
                            )}

                            <div className={styles.StartingOfChat}>
                                <img src={displayedContact.ProfileImg} className={styles.StartingOfChatImg} alt="Starting chat profile" />
                                <h6>{displayedContact.Name}</h6>
                                <div className={styles.StartingOfChatP}>
                                    <p className={styles.Role}>{displayedContact.CurrentRole}</p>
                                    <p>This is the very beginning of your direct message with <span>{displayedContact.Name}</span></p>
                                </div>
                            </div>

                            {/* Initial loading state with blur */}
                            {isLoadingMessages ? (
                                <MessageSkeletons />
                            ) : (
                                <div className={styles.Messages}>
                                    {displayedContact.Messages && displayedContact.Messages.length > 0 ? (
                                        displayedContact.Messages.map((message, index) => {
                                            return (
                                                <Message
                                                    key={index}
                                                    Role={message.Role}
                                                    Content={message.Content}
                                                    isRead={message.isRead}
                                                    ProfileImg={(message.Role === "receiver") ? displayedContact.ProfileImg : PersonalInfo.ProfileImg}
                                                />
                                            );
                                        })
                                    ) : (
                                        <p style={{ textAlign: 'center', color: '#999' }}>No messages yet. Start the conversation!</p>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        <div className={styles.MessageInput}>
                            <textarea
                                placeholder="send a message"
                                onChange={handleInputEntering}
                                value={MessageInput}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                disabled={isLoadingMessages}
                            />
                            <img
                                src={sendButton}
                                alt="Send button"
                                onClick={handleSendMessage}
                                style={{ 
                                    opacity: MessageInput.trim().length === 0 || isLoadingMessages ? 0.5 : 1, 
                                    cursor: MessageInput.trim().length === 0 || isLoadingMessages ? 'not-allowed' : 'pointer' 
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default UserMesssages
