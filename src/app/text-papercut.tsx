import { format } from "date-fns";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
import { $createListItemNode, $createListNode } from "@lexical/list";

/**
 * ChatCut PaperCut: Generate a structured PaperCut from your transcript input.
 */

export function generatePaperCut() {
    const root = $getRoot();

    /**
     * Generate today's PaperCut header
     */
    const paragraphHeader = $createParagraphNode();
    const currentDate = new Date();
    const todayPaperCutDate = format(currentDate, "ddMMyyyy");
    paragraphHeader.append(
        $createTextNode(`PaperCut: ${todayPaperCutDate}`)
    );

    /**
     * Section: Focus Areas
     */
    const paragraphFocus = $createParagraphNode();
    paragraphFocus.append($createTextNode("## Focus Areas"));
    const focusList = $createListNode("bullet");
    focusList.append(
        $createListItemNode().append(
            $createTextNode("..") // Placeholder for user input
        )
    );

    /**
     * Section: Pending Items
     */
    const paragraphQueue = $createParagraphNode();
    paragraphQueue.append($createTextNode("## Pending Items"));
    const queueList = $createListNode("bullet");
    queueList.append(
        $createListItemNode().append(
            $createTextNode("..") // Placeholder for user input
        )
    );

    /**
     * Section: Achievements
     */
    const paragraphAchieved = $createParagraphNode();
    paragraphAchieved.append($createTextNode("## Achievements"));
    const achievedList = $createListNode("bullet");
    achievedList.append(
        $createListItemNode().append(
            $createTextNode("..") // Placeholder for user input
        )
    );

    /**
     * Append all elements to the root
     */
    root.append(paragraphHeader);
    root.append(paragraphFocus);
    root.append(focusList);
    root.append(paragraphQueue);
    root.append(queueList);
    root.append(paragraphAchieved);
    root.append(achievedList);
}
