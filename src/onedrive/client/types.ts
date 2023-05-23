export type TGetMethodParams = {
	url: string;
	accessToken?: string;
};

export type TPostMethodParams = {
	url: string;
	accessToken: string;
	body: string;
};

export type TPutMethodParams = {
	url: string;
	accessToken: string;
	body: Uint8Array;
};

export type TPutMethodParamsWithContentInfo = {
	url: string;
	contentLength: string;
	contentRange: string;
	body: Uint8Array;
};

export type TDeleteMethodParams = {
	url: string;
	accessToken: string;
};
