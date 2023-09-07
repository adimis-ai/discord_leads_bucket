export const createBucketId = (serverID, channelID, memberID) => {
    const channelIDStr = channelID === null || channelID === "null" ? 'null' : channelID;
    const memberIDStr = memberID === null || memberID === "null" ? 'null' : memberID;
    const bucketID = `${serverID}/${channelIDStr}/${memberIDStr}`;    
    return bucketID;
};

export const parseBucketId = (bucketID) => {
    const [serverID, channelIDStr, memberIDStr] = bucketID.split('/');
    const channelID = channelIDStr !== 'null' ? channelIDStr : null;
    const memberID = memberIDStr !== 'null' ? memberIDStr : null;
    return {
        serverId: serverID,
        channelId: channelID,
        memberId: memberID
    };
};

export function parseMessagesArray(array) {
    const parsedArray = array.map(item => {
      try {
        return JSON.parse(item);
      } catch (error) {
        console.error("Error parsing JSON:", error);
        return null;
      }
    });
    return parsedArray;
};