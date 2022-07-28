function getUTCTimestampFromDate(date: Date) {
  return Math.floor(date.getTime() / 1000);
}

function getDateFromUTCTimestamp(timestamp: number) {
  return new Date(timestamp * 1000);
}

function getDateFromUTCString(utcString: string, time: string) {
  const dateStrings = utcString.split('.');
  const [hours, minutes] = time.split(':');
  return new Date(
    Date.UTC(
      parseInt(dateStrings[2], 10),
      parseInt(dateStrings[1], 10) - 1,
      parseInt(dateStrings[0], 10),
      parseInt(hours, 10),
      parseInt(minutes, 10)
    )
  );
}

function getUTCStringFromDate(date: Date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();

  return [
    `${day < 10 ? '0' + day : day}.${month < 10 ? '0' + month : month}.${year}`,
    `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}`
  ];
}

export default {
  getUTCTimestampFromDate,
  getDateFromUTCTimestamp,
  getDateFromUTCString,
  getUTCStringFromDate
};
