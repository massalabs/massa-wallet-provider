/**
 * This file defines a TypeScript module named connector that provides functionality
 * to communicate between a web page script and a content script. The content script is
 * expected to be injected into a web page by a browser extension.
 *
 */
import { uid } from 'uid';
import { ICustomEventMessageResponse } from './ICustomEventMessageResponse';
import { ICustomEventMessageRequest } from './ICustomEventMessageRequest';
import { IRegisterEvent } from './IRegisterEvent';
import {
  AvailableCommands,
  IAccount,
  IAccountBalanceRequest,
  IAccountBalanceResponse,
  IAccountDeletionRequest,
  IAccountDeletionResponse,
  IAccountImportRequest,
  IAccountImportResponse,
  IAccountSignRequest,
  IAccountSignResponse,
} from '..';

/**
 * A constant string that is used to identify the HTML element that is used for
 * communication between the web page script and the content script.
 */
const MASSA_WINDOW_OBJECT = 'massaWalletProvider';

type CallbackFunction = (
  result: AllowedResponses,
  error: Error | null,
) => unknown;

export type AllowedRequests =
  | object
  | IAccountBalanceRequest
  | IAccountSignRequest
  | IAccountImportRequest
  | IAccountDeletionRequest;

export type AllowedResponses =
  | object
  | IAccountBalanceResponse
  | IAccountSignResponse
  | IAccountImportResponse
  | IAccountDeletionResponse
  | IAccount[];

/**
 * Connector class
 *
 * @remarks
 * - This class is used to send messages to the content script and to receive messages from the content script.
 * - It is used to send messages to the content script and to receive messages from the content script.
 *
 */
class Connector {
  private registeredProviders: { [key: string]: string } = {};
  private pendingRequests: Map<string, CallbackFunction>;

  /**
   * Connector constructor
   *
   * @returns An instance of the Connector class.
   *
   * @remarks
   * - The Connector constructor takes no arguments.
   * - It creates a Map object that is used to store pending requests.
   * - It creates an HTML element that is used to communicate with the content script.
   * - It adds an event listener to the HTML element that is used to communicate with the content script.
   *
   */
  public constructor() {
    this.pendingRequests = new Map<string, CallbackFunction>();
    this.register();

    // start listening to messages from content script
    document
      .getElementById(MASSA_WINDOW_OBJECT)
      .addEventListener(
        'message',
        this.handleResponseFromContentScript.bind(this),
      );
  }

  /**
   * This method registers a new provider by creating a new HTML element and a
   * listener that listens to the 'register' event.
   *
   * @returns void
   *
   * @remarks
   * - It is used to register a new provider.
   * - This method creates a new HTML element and a listener that listens to the register event.
   *
   */
  private register() {
    // global event target to use for all wallet provider
    if (!document.getElementById(MASSA_WINDOW_OBJECT)) {
      const inv = document.createElement('p');
      inv.id = MASSA_WINDOW_OBJECT;
      inv.setAttribute('style', 'display:none');
      document.body.appendChild(inv);
    }

    // add an invisible HTML element and set a listener to it like the following
    // hook up register handler
    document
      .getElementById(MASSA_WINDOW_OBJECT)
      .addEventListener('register', (evt: CustomEvent) => {
        const payload: IRegisterEvent = evt.detail;
        const providerEventTargetName = `${MASSA_WINDOW_OBJECT}_${payload.providerName}`;
        this.registeredProviders[payload.providerName] =
          providerEventTargetName;
      });
  }

  /**
   * This method sends a message from the webpage script to the content script.
   * Sends a message to the content script using the specified provider name, command, and parameters,
   *
   * @param providerName - The name of the provider.
   * @param command - The command that is sent to the content script (among the {@link AvailableCommands}).
   * @param params - The parameters that are sent to the content script.
   * @param responseCallback - The callback function that is called when the content script sends a response.
   * @returns void
   *
   * @remarks
   * This method registers the response callback with a unique ID.
   *
   */

  public sendMessageToContentScript(
    providerName: string,
    command: AvailableCommands,
    params: AllowedRequests,
    responseCallback: CallbackFunction,
  ) {
    if (!Object.values(AvailableCommands).includes(command)) {
      throw new Error(`Unknown command ${command}`);
    }

    const requestId = uid();
    const eventMessageRequest: ICustomEventMessageRequest = {
      params,
      requestId,
    };
    this.pendingRequests.set(requestId, responseCallback);

    // dispatch an event to the specific provider event target
    const specificProviderEventTarget = document.getElementById(
      `${this.registeredProviders[providerName]}`,
    ) as EventTarget;
    if (!specificProviderEventTarget) {
      throw new Error(
        `Registered provider with name ${providerName} does not exist`,
      );
    }
    const isDispatched = specificProviderEventTarget.dispatchEvent(
      new CustomEvent(command, { detail: eventMessageRequest }),
    );
    if (!isDispatched) {
      throw new Error(
        `Could not dispatch a message to ${this.registeredProviders[providerName]}`,
      );
    }
  }

  /**
   * This method returns the registered providers.
   *
   * @param key - The name of the provider.
   * @returns The registered provider associated with the specified key.
   *
   */
  public getWalletProviders(): { [key: string]: string } {
    return this.registeredProviders;
  }

  /**
   * This method handles the response from the content script by
   * calling the response callback with the response and error objects.
   *
   * @param event - The event that is sent from the content script.
   * @returns void
   *
   */
  private handleResponseFromContentScript(event: CustomEvent) {
    const { result, error, requestId }: ICustomEventMessageResponse =
      event.detail;

    const responseCallback: CallbackFunction =
      this.pendingRequests.get(requestId);

    if (responseCallback) {
      if (error) {
        responseCallback(null, new Error(error.message));
      } else {
        responseCallback(result, null);
      }
      const deleted = this.pendingRequests.delete(requestId);
      if (!deleted) {
        console.error(`Error deleting a pending request with id ${requestId}`);
      }
    } else {
      console.error(
        `Request Id ${requestId} not found in response callback map`,
      );
    }
  }
}

export const connector = new Connector();
