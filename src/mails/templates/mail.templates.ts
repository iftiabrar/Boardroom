export function welcomeTemplate(name: string) {
    return {
        subject: 'Welcome to BoardRoom!',
        html: `<h2>Welcome, ${name}!</h2><p>Your BoardRoom account is ready. Join a study room or create your own to start collaborating.</p>`,
    };
}

export function inviteTemplate(roomName: string, inviterName: string, link: string) {
    return {
        subject: `You're invited to join "${roomName}" on BoardRoom`,
        html: `<p><strong>${inviterName}</strong> invited you to join <strong>${roomName}</strong>.</p><p>Preview & Join Link: <a href="${link}">${link}</a></p>`,
    };
}

export function lobbyDecisionTemplate(roomName: string, approved: boolean) {
    return {
        subject: approved
            ? `Approved: Welcome to ${roomName}`
            : `Update on your request to join ${roomName}`,
        html: approved
            ? `<p>Good news! Your request to join <strong>${roomName}</strong> has been <strong>approved</strong>.</p>`
            : `<p>Your request to join <strong>${roomName}</strong> was <strong>declined</strong> by the room owner.</p>`,
    };
}